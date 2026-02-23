import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { buildEmailHtml } from '../_shared/emailTemplate.ts';

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

    // Auth client — uses anon key + user's JWT to verify identity
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

    // Service client — bypasses RLS for DB queries
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { tenant_id } = await req.json();
    if (!tenant_id) {
      return new Response(JSON.stringify({ error: 'tenant_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch tenant details with unit and property info
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('first_name, last_name, email, unit_id')
      .eq('id', tenant_id)
      .single();

    if (tenantError || !tenant) {
      return new Response(JSON.stringify({ error: 'Tenant not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch unit + property info
    let unitName = '';
    let propertyName = 'your new home';
    let rentAmount = 0;
    if (tenant.unit_id) {
      const { data: unit } = await supabase
        .from('units')
        .select('name, rent_amount, property:properties(name)')
        .eq('id', tenant.unit_id)
        .single();

      if (unit) {
        unitName = unit.name ?? '';
        rentAmount = unit.rent_amount ?? 0;
        const property = unit.property as any;
        propertyName = property?.name ?? 'your new home';
      }
    }

    // Fetch landlord profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_name, first_name, last_name')
      .eq('id', user.id)
      .single();

    const companyName = profile?.company_name || `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || 'Your Landlord';
    const tenantName = `${tenant.first_name} ${tenant.last_name}`;
    const rentFormatted = rentAmount > 0 ? `J$${Number(rentAmount).toLocaleString()}` : null;

    const bodyHtml = `
      <p style="color: #374151; line-height: 1.6; margin: 0 0 16px 0;">Hi ${tenant.first_name},</p>
      <p style="color: #374151; line-height: 1.6; margin: 0 0 16px 0;">
        Welcome! You've been added as a tenant${propertyName !== 'your new home' ? ` at <strong>${propertyName}</strong>` : ''}.
        We're glad to have you.
      </p>
      ${unitName || rentFormatted ? `
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #f9fafb; border-radius: 8px;">
        ${unitName ? `
        <tr>
          <td style="padding: 12px 16px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Unit</td>
          <td style="padding: 12px 16px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb;">${unitName}</td>
        </tr>` : ''}
        ${rentFormatted ? `
        <tr>
          <td style="padding: 12px 16px; color: #6b7280;">Monthly Rent</td>
          <td style="padding: 12px 16px; font-weight: 600; color: #111827;">${rentFormatted}</td>
        </tr>` : ''}
      </table>` : ''}
      <p style="color: #374151; line-height: 1.6; margin: 16px 0 0 0;">
        If you have any questions, feel free to reach out to ${companyName}. We look forward to a great experience!
      </p>
      <p style="color: #374151; line-height: 1.6; margin: 16px 0 0 0;">Best regards,<br/><strong>${companyName}</strong></p>
    `;

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'EasyCollect <onboarding@resend.dev>',
        to: tenant.email,
        subject: `Welcome to ${propertyName}!`,
        html: buildEmailHtml('Welcome!', bodyHtml, companyName),
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
