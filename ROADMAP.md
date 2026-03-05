# EasyCollect — Product Roadmap & Gap Analysis

Last updated: 2026-03-01

---

## What We Have (Working)

### Authentication & Users
- Email/password signup and login (Supabase Auth)
- Role-based access (Landlord vs Tenant)
- Session persistence and auto-refresh
- Password change in Settings
- Sentry error monitoring

### Property & Unit Management
- Create/view properties with address
- Create/view units within properties with rent amounts
- Property → Unit → Tenant hierarchy
- Expandable property/unit lists in Settings
- Add Property modal (2-step wizard)

### Tenant Management
- Add/update/delete tenants
- Assign tenants to units
- Lease start/end dates
- Contact info (email, phone)
- Status tracking (active/inactive)
- Search, filter by payment status, pagination
- Slide-out detail panel
- Voice input for adding tenants

### Invoice Management
- Create invoices with amount, due date, description
- Auto-generated invoice numbers (INV-001)
- Status tracking (paid/pending/overdue)
- Payment links with unique tokens for public access
- CSV export
- Search and filter

### Payment Recording (Manual Only)
- Record payments with method (bank_transfer, card, cash, other)
- Link payments to invoices
- Auto-generated payment numbers (PAY-001)
- Payment date and notes
- Status tracking (completed, pending, failed)
- CSV export

### Payment Proof System
- Tenants upload proof images via public payment link
- Landlord reviews in "Pending Proofs" tab
- Approve (auto-creates payment + marks invoice paid) or reject with notes
- Image viewer modal
- One pending proof per invoice limit

### Public Payment Portal
- Tenant-facing page via `/pay/:token`
- Shows invoice details and bank info
- Upload proof without authentication
- Proof status tracking

### Dashboard
- Time-based greeting
- Stat cards: Expected, Collected, Outstanding, Overdue
- Collection percentage bar visualization
- Recent activity feed (last 5 payments)
- Overdue tenants with reminder buttons
- Setup banner for new users

### Email Reminders
- Manual "Send Reminder" on overdue tenants
- Edge function sends email with invoice + bank details
- Auto-remind toggle in notification settings

### AI Chat Assistant
- Local intent matching for common queries
- Falls back to OpenAI via edge function
- 5 requests/day limit
- Anonymized tenant data in context

### Receipt Generation
- Full receipt view with payment details
- Print functionality
- Unique receipt numbers

### Settings
- Profile (name, email, phone)
- Company info (name, address, city, country, website, tax ID)
- Bank details (bank name, account name, number, branch)
- Properties & units management
- Notification preferences (4 toggles)
- Billing (Free plan, Pro coming soon placeholder)
- Security (password change)

### UI/UX
- Collapsible sidebar (expands on hover, pushes content)
- Mobile slide-out drawer
- Setup Guide floating widget (3-step onboarding)
- Setup Banner on dashboard
- Containerized sections (white cards on light background)
- Toast notifications
- Empty states with icons
- Pagination (10 items/page)
- Responsive tables (columns hide on mobile)

---

## Database Schema (Supabase)

| Table | Purpose |
|-------|---------|
| `profiles` | Landlord & tenant user info, company, bank details, notification prefs |
| `properties` | Properties owned by landlords |
| `units` | Units within properties (name, rent_amount) |
| `tenants` | Tenant records (contact, unit assignment, lease dates) |
| `invoices` | Rent invoices (amount, due_date, status, payment_token) |
| `payments` | Payment records (amount, method, date, status) |
| `payment_proofs` | Proof image uploads (image_url, status, notes) |
| `late_fee_settings` | Late fee configuration per landlord |
| `lease_documents` | Uploaded lease/document files per tenant |
| `notifications` | In-app notifications per landlord |
| `ai_chat_usage` | Daily AI chat usage tracking per user |

16 migration files. Edge functions: send-reminder, send-welcome, send-landlord-welcome, send-receipt, apply-late-fees

---

## What's Missing

### Tier 1 — Must Have Before Launch

- [x] **Payment gateway integration (HandyPay)** _(done — Option C)_
  - Landlord pastes HandyPay payment link in Settings
  - Tenants see "Pay Online" button on `/pay/:token`
  - Bank transfer + proof upload remains as fallback

- [x] **Recurring invoice automation** _(done)_
  - Toggle in Settings → Recurring Invoices, configurable day of month (1-28)
  - Auto-generates invoices for active tenants with units, deduplication, optional email
  - Edge function + daily cron job (migration 017)

- [x] **Forgot password flow** _(done)_
  - Forgot password link on login, `/forgot-password` and `/reset-password` pages

- [x] **Email verification** _(done)_
  - `/email-verified` callback page

- [x] **Privacy policy & Terms of Service** _(done)_
  - `/privacy` and `/terms` pages

### Tier 2 — Expected by Users

- [x] **Late fee automation** _(done)_
  - Configurable flat/percentage fees, grace period, auto-apply toggle in Settings
  - Edge function + daily cron job (migration 016)

- [x] **Lease document storage** _(done)_
  - Upload/download/delete per tenant (PDF, JPG, PNG, DOC, DOCX, 10MB max)
  - Document types: Lease, Addendum, Other

- [ ] **Tenant payment history (tenant-side)**
  - Tenants can only upload proofs, can't see their own payment history
  - Need: tenant dashboard with payment list, receipt downloads

- [x] **Reporting & analytics page** _(done)_
  - `/reports` page with collection trends, P&L, by-property breakdown

- [x] **Bulk invoice generation** _(done)_
  - "Invoice All Tenants" button, duplicate detection per month

- [ ] **Customizable email templates**
  - Reminder emails aren't customizable by the landlord
  - Need: template editor in Settings, variables (tenant name, amount, etc.)

- [x] **Dedicated Properties page** _(done)_
  - `/properties` page with property cards, unit management, occupancy stats

### Tier 3 — Competitive Features

- [ ] **Maintenance request system**
  - No work order / repair request tracking
  - Need: tenant submission form, status tracking, photo uploads, contractor assignment

- [ ] **Multi-user / team access**
  - Only one landlord account per organization
  - Need: invite team members, role-based permissions (admin, manager, viewer)

- [ ] **Accounting integration (QuickBooks, Xero)**
  - All bookkeeping is manual
  - Need: OAuth connection, transaction sync, chart of accounts mapping

- [x] **Audit trail / activity log** _(done)_
  - `activity_logs` table with immutable RLS, all service functions log actions
  - `/activity-log` page with entity/action filters and pagination

- [ ] **SMS / WhatsApp reminders**
  - Email-only communication
  - Need: Twilio or WhatsApp Business API integration

- [x] **Calendar view** _(done)_
  - Custom month grid with invoice due dates, payments, lease start/end events
  - `/calendar` page with stat cards, month navigation, day detail panel

- [ ] **Dark mode**
  - Single light theme only

---

## Technical Debt & Gaps

### High Priority
- [ ] **Loading skeletons** — Replace spinners with skeleton UI for perceived performance
- [ ] **404 page** — Dead routes redirect silently, need proper "not found" page
- [ ] **Component error boundaries** — One crash takes down the whole app
- [ ] **Password reset page** — UI for handling reset email callback
- [ ] **Code splitting** — Bundle is 940KB, need lazy loading for routes

### Medium Priority
- [ ] **Image compression** — Payment proof uploads have no size limits
- [ ] **Duplicate payment detection** — Could accidentally record same payment twice
- [ ] **Optimistic updates** — UI waits for server before updating state
- [ ] **Confirmation dialogs** — Destructive actions use browser `confirm()` instead of custom modal
- [ ] **Keyboard shortcuts** — No keyboard navigation beyond browser defaults

### Low Priority
- [ ] **Offline support / PWA** — No service worker, no offline capability
- [ ] **Rate limiting on login** — No protection against brute force
- [ ] **CAPTCHA on public forms** — Payment proof upload has no bot protection
- [ ] **Accessibility audit** — ARIA labels, keyboard nav, screen reader testing
- [ ] **Structured logging** — Only console.error, no JSON structured logs
- [ ] **Performance monitoring** — No Web Vitals tracking

---

## Recommended Build Order

### Phase 1: Ship-Ready (2-3 weeks)
1. Forgot password flow (page + email)
2. Recurring invoice automation (monthly auto-generate)
3. Bulk invoice generation ("Invoice all tenants")
4. Privacy policy + Terms of Service pages
5. 404 page
6. Loading skeletons
7. Code splitting (lazy routes)

### Phase 2: Real Payments (2-4 weeks)
1. Stripe integration (checkout sessions)
2. Webhook handling (payment confirmation)
3. Payment status auto-update
4. Refund management
5. Transaction fee display

### Phase 3: Tenant Experience (2-3 weeks)
1. Tenant dashboard (payment history, receipts)
2. Lease document upload & viewing
3. Late fee automation
4. Customizable email templates

### Phase 4: Scale & Compete (4-6 weeks)
1. Dedicated Properties page
2. Reporting & analytics
3. Multi-user / team access
4. Audit trail
5. Maintenance requests
6. Accounting integration

---

## Tech Stack Reference

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| UI Components | Radix UI, Lucide Icons, custom glass design system |
| Validation | Zod schemas |
| Backend | Supabase (Auth, Database, Storage, Edge Functions) |
| Email | Resend (via edge functions) |
| AI | OpenAI (via edge function), local intent matching |
| Monitoring | Sentry |
| Testing | Vitest, Playwright (configured, minimal coverage) |
| Deployment | Vercel (assumed from config) |
