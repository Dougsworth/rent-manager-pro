#!/bin/bash
set -e

echo "Deploying EasyCollect Edge Functions..."
echo "======================================="

# Deploy all edge functions
FUNCTIONS=(
  "ai-chat"
  "send-reminder"
  "send-welcome"
  "send-landlord-welcome"
  "auto-remind"
  "send-receipt"
)

for fn in "${FUNCTIONS[@]}"; do
  echo ""
  echo "Deploying: $fn"
  supabase functions deploy "$fn"
done

echo ""
echo "Pushing database migrations..."
supabase db push

echo ""
echo "======================================="
echo "Deployment complete!"
echo ""
echo "REMINDERS:"
echo "  1. Ensure secrets are set:"
echo "     supabase secrets set RESEND_API_KEY=re_xxx"
echo "     supabase secrets set OPENAI_API_KEY=sk-xxx"
echo "     supabase secrets set SITE_URL=https://your-url.com"
echo ""
echo "  2. Update Resend 'from' address to your verified domain"
echo "  3. Configure auto-remind cron job in Supabase Dashboard"
