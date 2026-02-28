# EasyCollect Deployment Guide

## Prerequisites

- [Node.js 22+](https://nodejs.org/)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Supabase project (with database migrations applied)
- [Resend](https://resend.com/) account for transactional email
- [OpenAI](https://platform.openai.com/) API key for AI chat feature

## Environment Variables

### Client-Side (Vite)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID |
| `VITE_SENTRY_DSN` | Sentry DSN for error tracking (optional) |

### Edge Function Secrets

| Secret | Description |
|--------|-------------|
| `RESEND_API_KEY` | Resend API key for sending emails |
| `OPENAI_API_KEY` | OpenAI API key for AI chat |
| `SITE_URL` | Production URL (e.g. `https://easycollect.com`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected by Supabase |

## Supabase Secrets Setup

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
supabase secrets set OPENAI_API_KEY=sk-xxxxxxxxxxxx
supabase secrets set SITE_URL=https://your-production-url.com
```

## Edge Function Deployment

Deploy all 6 edge functions:

```bash
supabase functions deploy ai-chat
supabase functions deploy send-reminder
supabase functions deploy send-welcome
supabase functions deploy send-landlord-welcome
supabase functions deploy auto-remind
supabase functions deploy send-receipt
```

Or use the deploy script:

```bash
chmod +x deploy.sh
./deploy.sh
```

## Database Migrations

```bash
supabase db push
```

## Resend Production Domain

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add and verify your production domain
3. Update the `from` address in edge functions from `onboarding@resend.dev` to your verified domain (e.g. `noreply@easycollect.com`)

## Cron Job Configuration

The `auto-remind` function runs on a schedule to automatically send overdue reminders. Configure via the Supabase Dashboard:

1. Go to **Database > Extensions** and enable `pg_cron`
2. Add a cron job:
   ```sql
   SELECT cron.schedule(
     'auto-remind-daily',
     '0 9 * * *',  -- 9 AM daily
     $$
     SELECT net.http_post(
       url := 'https://YOUR_PROJECT.supabase.co/functions/v1/auto-remind',
       headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
     );
     $$
   );
   ```

## Production Build

```bash
npm run build
```

The output will be in the `dist/` directory. Deploy to any static hosting provider:

- **Vercel**: `npx vercel --prod`
- **Netlify**: Drag and drop `dist/` or connect via Git
- **Cloudflare Pages**: Connect your repository

## Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Supabase secrets are configured
- [ ] All 6 edge functions are deployed
- [ ] Database migrations are applied
- [ ] Resend domain is verified and `from` address updated
- [ ] Cron job for `auto-remind` is configured
- [ ] Sentry DSN is set (optional but recommended)
- [ ] Test signup flow end-to-end
- [ ] Test payment reminder email
- [ ] Test AI chat functionality
- [ ] Test public payment link and proof upload
