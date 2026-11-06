# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Jamaicans collecting money they are owed, weighted equally between two kinds of people: small landlords collecting rent, and private lenders tracking personal loans. They run this alongside a day job, usually from a phone, and often have a handful of tenants or borrowers rather than a portfolio.

Second audience: the tenant who receives a payment link. They have no account, are on a phone, and just need the amount, where to send it, and a way to show they paid.

## Product Purpose

EasyCollect shows a collector who owes them, how much, and how late, then helps them chase it and keep proof. Success: a collector knows where they stand and acts within seconds, and a tenant pays from a link without signing up.

## Positioning

Built around how money actually moves in Jamaica: bank transfers and screenshots. The payment link and proof of payment flow replaces "I already sent it" arguments. Tenants need no account and no app.

## Operating Context

Amounts are in Jamaican dollars. Payment is mostly bank transfer with a screenshot as proof, plus cash and HandyPay online checkout. Links get shared over WhatsApp and email. Reminders go by email. Phone use on mobile data matters as much as desktop.

## Capabilities and Constraints

- Rent: properties, units, tenants, leases, invoices, recurring invoices, late fees, payments, proof review, receipts, reminders, reports, calendar.
- Loans: borrowers, loans, installments, repayments.
- Also: activity log, notifications, AI assistant, CSV and PDF export, PWA install.
- Stack: React, Vite, Tailwind 4, Supabase. Hosted on Vercel.
- Terminology: EasyCollect is the product name, on easycollectja.com. Say tenant, borrower, invoice, proof of payment.
- The native app in `mobile/` is separate and out of scope for this redesign. It should inherit the visual system later.
- Pricing decision: free today, and Pro is shown as coming soon with no price commitment.

## Brand Commitments

- Name: EasyCollect. Tagline in use: "Collect anything, easily".
- Visual identity is open for replacement.

## Evidence on Hand

No verified customer numbers, testimonials, rankings or performance claims exist. Never show invented ones. The product itself (real screens, the real flow, the JDPA and security facts that are verifiable in the code) is the proof until real quotes arrive.

## Product Principles

1. Money owed comes first. Every screen answers who owes what before anything else.
2. One next action. When someone is late, the way to chase them is right there.
3. Respect the person being chased. Reminders and tenant pages are clear and dignified, never shaming.
4. Honest by default. No invented proof, no fake urgency, no dark patterns.
5. Works on a cheap phone on mobile data.

## Accessibility & Inclusion

WCAG AA contrast and touch targets across the app and payment page. Status is never carried by colour alone.
