# TODO — Easy Rent Collect

## Deploy Edge Functions
- [ ] `supabase functions deploy auto-remind`
- [ ] `supabase functions deploy send-reminder`

## Set Secrets (once you have a domain)
- [ ] `supabase secrets set SITE_URL=https://your-domain.com`
  - This makes the "Pay Now" button in reminder emails point to the correct URL
  - Also used by auto-remind emails

## Test Auto Reminders
- [ ] Go to Settings > Notifications and toggle on "Automatic Reminders"
- [ ] Verify cron job runs daily at 8am UTC (check Supabase Dashboard > Logs)
- [ ] Confirm overdue tenants receive the email with payment link

## Invoice Numbering
- [ ] Run migration 007 if not already done (`supabase db push`)
- [ ] New invoices will use format INV-ARB-001 (per-tenant with initials)
- [ ] Old invoices keep their existing numbers

## General
- [ ] Set up custom domain and update SITE_URL secret
- [ ] Update Resend from sandbox (`onboarding@resend.dev`) to a real sending domain
- [ ] Consider adjusting cron schedule from 8am UTC to match your timezone
