# EasyCollect design system

Direction: **Architectural Utility**. Caribbean structure without tropical imagery: a deep green rail, a warm off-white ground, hairline rules, and the rhythm of louvres used for payment history. Contemporary and professional, never rustic or decorative.

Product promise: *Know what's owed. Know what to do.* A landlord or lender opens the app and knows within five seconds who to chase. Read PRODUCT.md for users and principles.

## Rules that are never broken

- No cards, no boxes inside boxes, no tinted panels. Group with space and 1px rules (`border-t border-rule`). The only filled regions are the green rail and the phone header and tab bar.
- No gradients, glass, blur, glows, or decorative shadows. `shadow-lg` exists only for floating layers (menus, dialogs, popovers).
- No pills. Corners are 3px on controls and nothing else is rounded, except avatars and spinners.
- No icon tiles. Icons are Lucide, stroke only, `currentColor`, never inside a coloured square. Prefer words over icons. No emoji.
- No eyebrow or kicker labels above headings. No section numbers. No uppercase tracked labels.
- No invented numbers, customers, quotes or claims anywhere, including marketing.
- Status is never colour alone: always words, and a drawn mark where space allows.
- Copy is plain, short, human. No hyphens or em dashes in UI copy. Controls name the action ("Send reminder", "Mark paid", "Copy pay link"). Errors say what happened and what to do.

## Type

Archivo Variable (self hosted, `@fontsource-variable/archivo/wdth.css`), the only family. Tabular numerals for all money (`num` utility). Display sizes use `display` (88% width, -0.025em).

| Role | Class |
|---|---|
| Anchor figure | `display num text-[42px] sm:text-[68px] font-bold leading-none` |
| Page title | `PageHeader` (34 to 40px bold display) or person name 34 to 46px |
| Section heading | `text-[15px] font-semibold` or `text-base font-semibold` |
| Row name | `text-base font-semibold` (late) or `font-medium` |
| Body, controls | 15px / `text-sm` for controls |
| Supporting | `text-[13.5px] text-quiet` |

Never below 13px except louvre month letters (10.5px).

## Colour (tokens in `src/index.css`)

| Token | Hex | Use |
|---|---|---|
| `shell` | #0E3B30 | Rail, phone bars, primary buttons, links |
| `shell-ink` | #D4E3DA | Text on shell |
| `marker` | #E7B24C | Current nav item marker, phone record button. Nothing else |
| `ground` | #F6F4EE | Page |
| `popover` | #FBFAF6 | Menus, dialogs |
| `secondary` | #ECEAE2 | Hover fills, quiet buttons |
| `rule` | #DAD8CF | Hairlines |
| `input` | #B6BEB3 | Field and outline button borders |
| `ink` | #12241D | Text |
| `quiet` | #55635B | Secondary text (5.9:1 on ground) |
| `paid` | #0E5A47 | Paid, success, focus ring |
| `late` | #A63A17 | Late, destructive, errors |
| `due` | #7A5600 | Pending or warning text |

Tailwind's slate, gray, neutral, blue, emerald, green, amber, yellow, orange and red scales are remapped onto these, so old classes do not break, but new code uses the semantic names. Never introduce new hex values. Never use purple, indigo or pink.

## Space and layout

4px base: 4, 8, 12, 16, 20, 24, 32, 44. Content max width 1180px, gutters 16px phone, 32px tablet, 44px desktop. Rail 216px at `lg`. Lists are full width rows separated by rules. Tables become stacked rows below `lg`, or scroll inside `overflow-x-auto` when they must stay tabular.

## Components (in `src/components`)

- `ui/button`: default (green), outline, ghost, destructive, secondary. Heights 40, 36 (sm), 48 (lg). Labels are verbs.
- `ui/input`, `ui/select` (Radix), `ui/label`: 40px fields, 1px `input` border, green focus outline.
- `ui/card`: a section with a top rule, not a box. `CardContent` has no side padding.
- `ui/status-badge`: drawn mark plus words. paid, pending, overdue, default.
- `ui/stat-card`: a plain figure (label, value, note). Use sparingly. A page gets at most one row of figures, and only one figure is large.
- `PageHeader`, `FilterTabs` (underline tabs), `EmptyState` (heading, one line, one action, no icon tile).
- `collect/PaymentLouvre` and `LouvreKey`: the signature. Twelve fins, oldest first. Full is paid on time, short is paid late, hatched rust is late now, outlined is due, grey is before they began. Always with month letters.
- `collect/CollectionRow`: a person who owes you, with louvre, timing, amount, primary action and Mark paid.
- `collect/ReminderButton`: one click, 5 second undo, then "Reminded today".
- `collect/QuickPayment`: inline record payment, prefilled, Enter saves, Esc cancels.
- `collect/GlobalSearch`: tenants, borrowers, properties. `/` focuses it.
- `collect/PersonParts`: owed line, actions, history section, timeline, facts list for person pages.

## Landing page

The landing page (`src/pages/Landing.tsx`) opens and closes on the shell green and uses a cooler limestone ground (#ECEFEA, rules #D2D8D0) set on its root, because the warm cream reads as the default AI surface. Display type there is weight 500, not bold: hero 44 / 64 / 72px, section headings 34 to 40px. Headlines end without a period. The hero's proof is `landing/LedgerDemo`, a working sample of the Today page with local state only; it is labelled as sample data and never touches the backend.

## Patterns

- Lists: rows with `border-t border-rule py-3`, name links to the person page, the most important number right aligned, at most two actions.
- Dialogs only for creating or confirming. Prefer inline expansion for quick edits.
- Empty states say what will appear and give one action.
- Loading uses `Skeleton` blocks shaped like the content.
- Motion: 100 to 180ms colour and opacity only. No entrance animations on sections, no floating or pulsing. Respect reduced motion.
- Mobile: bottom tab bar (Today, People, record, Money, More), section tabs under the header on People and Money screens, primary actions full width at 48px.
