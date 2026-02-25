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

    let message: string | undefined;
    let context: string | undefined;
    try {
      const body = await req.json();
      message = body?.message;
      context = body?.context;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // Call OpenAI GPT API
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
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

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!openaiRes.ok) {
      const errorBody = await openaiRes.text();
      console.error('OpenAI API error:', openaiRes.status, errorBody);
      return new Response(JSON.stringify({
        error: 'AI service error',
        status: openaiRes.status,
        details: errorBody.slice(0, 500),
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openaiData = await openaiRes.json();
    const reply =
      openaiData.choices?.[0]?.message?.content ??
      'Sorry, I could not generate a response.';

    // Increment usage ONLY after successful AI response
    const newCount = currentCount + 1;
    const { error: usageWriteErr } = await supabase
      .from('ai_chat_usage')
      .upsert(
        { landlord_id: user.id, usage_date: today, request_count: newCount },
        { onConflict: 'landlord_id,usage_date' }
      );
    if (usageWriteErr) {
      console.error('usage write error:', usageWriteErr);
    }

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
