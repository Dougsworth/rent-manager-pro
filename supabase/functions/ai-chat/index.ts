import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const DAILY_LIMIT = 20;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Auth client — verify user identity
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service client — bypasses RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { message, context } = await req.json();
    if (!message) {
      return new Response(JSON.stringify({ error: 'message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check rate limit
    const today = new Date().toISOString().split('T')[0];
    const { data: usageRow } = await supabase
      .from('ai_chat_usage')
      .select('request_count')
      .eq('landlord_id', user.id)
      .eq('usage_date', today)
      .maybeSingle();

    const currentCount = usageRow?.request_count ?? 0;
    if (currentCount >= DAILY_LIMIT) {
      return new Response(JSON.stringify({
        error: 'Daily AI limit reached',
        usage: { request_count: currentCount, limit: DAILY_LIMIT, remaining: 0 },
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Upsert to increment counter
    await supabase
      .from('ai_chat_usage')
      .upsert(
        { landlord_id: user.id, usage_date: today, request_count: currentCount + 1 },
        { onConflict: 'landlord_id,usage_date' }
      );

    // Call Gemini API
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are J$, an AI assistant for a Jamaican rent collection platform called EasyCollect. You help landlords manage their properties and tenants.

Key rules:
- Currency is Jamaican Dollars (J$), always format as J$X,XXX
- Be concise, friendly, and professional
- When drafting messages for tenants, be firm but polite
- If given anonymized data (Tenant A, B, C...), work with those labels
- Focus on actionable advice for rent collection

Context about this landlord's data:
${context || 'No additional context provided.'}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: message }] },
          ],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errorBody = await geminiRes.text();
      console.error('Gemini API error:', errorBody);
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiData = await geminiRes.json();
    const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sorry, I could not generate a response.';

    const newCount = currentCount + 1;
    return new Response(JSON.stringify({
      reply,
      usage: { request_count: newCount, limit: DAILY_LIMIT, remaining: DAILY_LIMIT - newCount },
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
