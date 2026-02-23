import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { buildEmailHtml } from '../_shared/emailTemplate.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, first_name, last_name } = await req.json();
    if (!email || !first_name) {
      return new Response(JSON.stringify({ error: 'email and first_name are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const fullName = `${first_name} ${last_name ?? ''}`.trim();

    const bodyHtml = `
      <p style="color: #374151; line-height: 1.6; margin: 0 0 16px 0;">Hi ${first_name},</p>
      <p style="color: #374151; line-height: 1.6; margin: 0 0 16px 0;">
        Welcome to <strong>EasyCollect</strong>! We're excited to have you on board.
      </p>
      <p style="color: #374151; line-height: 1.6; margin: 0 0 16px 0;">
        With EasyCollect you can:
      </p>
      <ul style="color: #374151; line-height: 1.8; margin: 0 0 16px 0; padding-left: 20px;">
        <li>Manage your properties and units in one place</li>
        <li>Add tenants and track leases effortlessly</li>
        <li>Generate invoices and record payments</li>
        <li>Send automatic payment reminders</li>
      </ul>
      <p style="color: #374151; line-height: 1.6; margin: 0 0 16px 0;">
        Get started by adding your first property from the dashboard. If you have any questions,
        we're here to help!
      </p>
      <p style="color: #374151; line-height: 1.6; margin: 16px 0 0 0;">Happy renting,<br/><strong>The EasyCollect Team</strong></p>
    `;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'EasyCollect <onboarding@resend.dev>',
        to: email,
        subject: 'Welcome to EasyCollect!',
        html: buildEmailHtml('Welcome to EasyCollect!', bodyHtml, 'EasyCollect'),
      }),
    });

    if (!emailRes.ok) {
      const errorBody = await emailRes.text();
      console.error('Resend API error:', errorBody);
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await emailRes.json();
    return new Response(JSON.stringify({ success: true, email_id: result.id }), {
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
