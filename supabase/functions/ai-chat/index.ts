import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'npm:zod';
import { corsHeaders } from '../_shared/cors.ts';

const chatRequestSchema = z.object({
  message: z.string().min(1, 'message is required'),
  context: z.string().optional(),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() }))
    .max(12)
    .optional(),
});

const DAILY_LIMIT = 5;

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

    let message: string;
    let context: string | undefined;
    let history: { role: 'user' | 'assistant'; content: string }[] = [];
    try {
      const body = await req.json();
      const parsed = chatRequestSchema.safeParse(body);
      if (!parsed.success) {
        return new Response(JSON.stringify({ error: parsed.error.issues[0].message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      message = parsed.data.message;
      context = parsed.data.context;
      history = parsed.data.history ?? [];
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
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

    const systemPrompt = `You are J$, the AI assistant inside EasyCollect — a Jamaican platform for collecting RENT and managing LOANS. You help landlords/lenders with two things: (1) questions about their own data, using the context provided below, and (2) how-to questions about using the app.

What EasyCollect does:
- RENT: Landlords add Properties and Units, add Tenants, and issue Invoices (one-off, bulk "invoice all tenants", or recurring monthly). Tenants pay online (card) or upload a payment proof the landlord approves. Receipts are emailed. Overdue invoices trigger reminders and optional automatic late fees (set in Settings → Late Fees).
- LOANS: Lenders add Borrowers, then create Loans (principal, interest rate, term in months, start date). Interest is SIMPLE interest: total repayable = principal × (1 + rate% × term/12); the monthly installment is that total ÷ term. Creating a loan auto-generates a monthly installment schedule.
- Recording a loan payment applies it to the oldest unpaid installments first; a lump sum can clear several, an underpayment leaves the next one open. When all installments are covered the loan auto-becomes "Paid Off".
- "Overdue" = an installment past its due date that isn't paid; a daily job flags these and notifies the lender.
- "Mark as Defaulted" flags a loan as non-performing: it moves to the Defaulted tab, leaves the Active Loans count, and hides Record Payment/Edit. It does NOT delete the loan or change balances.
- A loan's terms can be edited only before its first payment (after that, only notes); deleting a loan or borrower is permanent and removes their history.
- Other areas: Dashboard (rent + loan summary), Reports (P&L + loan portfolio, CSV export), Notifications, Activity Log, Calendar, Settings (company, bank details, payment gateway, notifications), and a Help & FAQ page.
- Note: online payment and self-service payment links currently exist for RENT invoices only, not loans (loan payments are recorded manually for now).

Key rules:
- Currency is Jamaican Dollars (J$), always format as J$X,XXX.
- Be concise, friendly, and professional. Use the data context below for "my numbers" questions; for how-to questions, explain the steps using the features above.
- If a how-to question is outside EasyCollect's features, say so briefly rather than inventing a feature.
- When drafting messages for tenants or borrowers, be firm but polite.
- If given anonymized data (Tenant A, B, C...), work with those labels.

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
          ...history,
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
    const tokenUsage = openaiData.usage;
    console.log('OpenAI token usage:', JSON.stringify(tokenUsage));
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
