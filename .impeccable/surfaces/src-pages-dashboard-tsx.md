---
version: 1
slug: "src-pages-dashboard-tsx"
primary_target: "src/pages/Dashboard.tsx"
related_targets: ["src/components/AppLayout.tsx","src/pages/TenantProfile.tsx","src/pages/PublicPayment.tsx"]
---

Scope: the signed in landlord and lender app (Operate mode), its shell, Today screen, person pages, and the tenant pay link.

Audience and job: Jamaican landlords and private lenders, usually on a phone, who need to know who owes them and act in seconds. Tenants open the pay link with no account.

## Direction contract

THESIS: A money tool that answers "who do I chase today" before anything else. It refuses the category default of four equal stat cards over a chart and a table.

OWN-WORLD: Kingston architecture without tropical imagery. Deep louvre green rail #0E3B30, warm off-white ground #F6F4EE, ink #12241D, hairline rules #DAD8CF, rust #A63A17 for late, a single gold marker #E7B24C for the current place. Archivo, slightly narrow at display sizes, tabular money. Square 3px controls, no cards, no shadows.

STORY: The visitor sees the total still owed, sees which people are late and by how much, sees their payment history at a glance, and sends a reminder or marks a payment without leaving the row.

FIRST VIEWPORT: Green rail left (216px) with Today, People, Money, Places groups. Top right search and Record a payment. Date line, then the owed total at 68px as the anchor, then one sentence of late, coming up and collected. Below, "Chase these first": rows with name and place, a twelve fin louvre row with month letters, days late in rust words, amount right aligned, Send reminder and Mark paid.

FORM: Grounded direction "Architectural Utility" (fourth candidate of seven presented: louvres and painted concrete), chosen by the user over Modern Ledger, Contemporary Fintech and Original EasyCollect. seed:b2d09f5c09217775

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
