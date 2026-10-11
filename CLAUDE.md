# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Next.js)
npm run build        # Production build
npm run lint         # ESLint
npx prisma studio   # Visual DB editor at localhost:5555
npx prisma generate # Regenerate Prisma client after schema changes
npx prisma migrate dev --name <name>  # Create new migration
docker compose up -d # Start local PostgreSQL
```

## Architecture

**finplan.ai** is a personal finance management app built with Next.js 15 (App Router), Prisma 5, Clerk auth, and PostgreSQL.

### Key Structure

- `app/_lib/prisma.ts` — Singleton PrismaClient export (`db`)
- `app/_lib/get-effective-user-id.ts` — Returns effective userId (supports account sharing)
- `app/_actions/` — Server Actions (e.g., `upsert-transaction`, `pay-credit-card-bill`)
- `app/_data/` — Data fetching functions (e.g., `get-credit-card-summary`, `get-credit-card-bills`)
- `app/_components/` — Shared components (UI primitives in `ui/`, feature components alongside)
- `app/_constants/` — Label mappings and select options for enums
- `app/(home)/` — Dashboard (logged in) or Landing Page (visitors)
- `app/transactions/` — Transactions page with `_columns/` and `_components/`
- `app/credit-cards/` — Credit cards, bills, installments management
- `app/budget/` — Unified categories & budget management (rename defaults, custom categories, budget limits)
- `app/recurring/` — Recurring expenses and incomes management (CRUD, pay, toggle, receive)
- `app/categories/` — Redirects to `/budget`
- `app/guias/` — Public SEO guides (static, no login). Content is data in `app/guias/_content/guides.ts` (blocks: p/h2/list/tip/cta, inline **bold**); each guide gets metadata, canonical, Article + BreadcrumbList JSON-LD and enters the sitemap automatically. To add a guide, append to `GUIDES` — keep financial facts verifiable
- `app/_components/public-header.tsx` — Header shared by landing and guides
- `app/subscription/` — Plans page (free vs premium)
- `app/shopping-list/` — Shopping list page (add/remove items, syncs with WhatsApp)
- `app/settings/` — Settings page (WhatsApp link)
- `app/api/cron/recurring-reminders/` — Daily WhatsApp reminders for due expenses
- `middleware.ts` — Clerk auth middleware with route protection (`auth.protect()`)
- `public/sw.js` — Service Worker (push notifications only, NO fetch handler)
- `prisma/schema.prisma` — Database models and enums

### Database Models

- **Transaction** — Income, expenses, investments with categories, payment methods, installments, credit card relation
- **CreditCard** — User credit cards with limit, closing day, due day, brand
- **CreditCardBill** — Monthly bills per card with status (OPEN/CLOSED/PAID/OVERDUE), auto-computed from dates
- **Budget** — Monthly budget limits per category
- **CustomCategory** — User-defined categories
- **UserCategoryLabel** — User overrides for built-in category names
- **AccountShare / AccountShareInvite** — Account sharing between users
- **RecurringExpense** — Fixed monthly expenses (rent, utilities) with due day, active/inactive, linked transactions for payment tracking
- **RecurringIncome** — Fixed monthly incomes (salary, freelance) with receive day, active/inactive, linked DEPOSIT transactions
- **WhatsAppLink** — Links a user's phone number to their account for WhatsApp transactions
- **WhatsAppSession** — Tracks multi-step conversation state and message dedup locks
- **ShoppingListItem** — Shopping list items per user (name, createdAt)

### Key Features

- **Landing Page** — Route `/` shows landing page for unauthenticated visitors, dashboard for logged users
- **Credit Card Bills** — Auto-created per card/month, status transitions: OPEN → CLOSED → PAID/OVERDUE based on closing/due dates. No duplicate transactions on bill payment.
- **Installments** — Up to 48x, creates N transactions with divided amounts spread monthly
- **AI Reports** — OpenAI (gpt-4o) financial analysis with transactions, budgets, credit cards, bills data. Includes 3-month history for trend analysis. Motor de análise: saúde financeira, categorias com tendência, reclassificação inteligente, orçamento vs realidade, anomalias, plano de ação priorizado. Structured prompt with scoring.
- **Account Sharing** — Share financial data with a partner via invite system
- **PIX Payment** — Mercado Pago integration for lifetime plan. QR code modal on subscription page, webhook with HMAC validation, Telegram notification on payment received.
- **Recurring Expenses** — Fixed monthly bills (rent, utilities, internet). CRUD with category, due day, active/inactive toggle. "Pay" button creates a real Transaction linked via `recurringExpenseId`. Badge shows Paid/Pending per month. Dashboard widget shows upcoming due dates (next 7 days, excludes paid).
- **Recurring Income** — Fixed monthly incomes (salary, freelance). CRUD at `/recurring` alongside expenses. "Receive" creates DEPOSIT transaction with SALARY category. Expected income shown as reference line in monthly bar chart. "Outras entradas do mês" card lists DEPOSITs without `recurringIncomeId` (PIX received, imports, one-offs); "Vincular" (`linkIncomeToRecurring`) ties one to a recurring income as that month's receipt instead of creating a duplicate.
- **Credit Card Dashboard** — "Cartões de crédito" block: per card, the selected month's bill (status + due date), the open bill (closing/due dates) and limit usage meter; plus a chart of the next 6 bills (all cards, per-card breakdown in tooltip). Data from `app/_data/get-credit-card-outlook.ts` (same bill windows as `get-credit-card-bills`).
- **Month Filter** — `TimeSelect` (prev/next arrows + month-year select) on dashboard, `/transactions`, `/credit-cards` and `/recurring`, via `?month=YYYY-MM`. On `/recurring`, Pay/Receive for a past/future month are dated on the due/receive day of that month (`periodDate`).
- **Recurring Reminders** — VPS Cron (`0 9 * * *` BRT on 212.56.33.113) calls `/api/cron/recurring-reminders`. Sends WhatsApp + push notification to users with unpaid expenses due today, and credit card bill reminders 3 days before and on the due day (unpaid bills with an amount; due date from the BillCalendar, see `app/_lib/bill-reminders.ts`). Protected with `CRON_SECRET`.
- **Push Notifications** — VAPID web push via `web-push` package. Auto-resubscribes on PWA reinstall. Model `PushSubscription` in Prisma.
- **WhatsApp Transactions** — Register transactions via WhatsApp using Evolution API. Webhook at `/api/webhooks/evolution`. Supports credit card selection, installments, multi-step conversation. Settings page at `/settings` to link/unlink phone number. Sessions timeout after 10 min. User can send "cancelar" to abort a flow. Bot messages must be in the `rawText.startsWith(...)` filter array to prevent reprocessing.
- **WhatsApp Voice** — Audio messages are transcribed via OpenAI Whisper (whisper-1, language: pt). Audio is downloaded from Evolution API (`getBase64FromMediaMessage`), converted to File, sent to Whisper. Transcribed text is processed as any regular text command (transactions, shopping list, help, etc.).
- **Shopping List** — Via WhatsApp: "comprar arroz, feijão" adds items, "comprei arroz" removes items and shows remaining, "lista"/"supermercado"/"compras" shows pending items. Via app: page at `/shopping-list` with add (comma-separated), remove, clear all. Free feature. Model `ShoppingListItem` in Prisma. Server actions in `app/_actions/shopping-list/`.
- **Statement Import** — `/import`: upload account OFX or card bill PDF/OFX → review screen → confirm. Parsing in `app/_lib/import/`: `ofx.ts`; card bill PDF = `pdf-text.ts` (unpdf text items → column split by x-gap, so side-by-side card blocks don't interleave) + regex line reader in `pdf.ts`, falling back to gpt-4.1-mini on the text only when the regex sum doesn't match the printed bill total; account statement PDF = OpenAI Responses `input_file` (gpt-4o), validated by opening + movements = closing balance. Categorization layers in `categorize.ts`: learned `CategoryRule` → user history → keywords → AI (gpt-4o-mini, merchant text only) → OTHER. Duplicates detected by `Transaction.externalId` (unique per user), installment match, or same amount ±3 days. Account "pagamento de fatura" lines mark the card bill PAID (no new expense). Card lines are re-dated into the imported bill's window. Preview is a route handler (`/api/import/preview`, Server Actions cap bodies at 1 MB); confirm is the `importStatement` action; `undoImport` deletes a batch. Free plan: 1 import/month, ≤50 lines (doesn't count toward the 15 transactions). `Transaction.source` = MANUAL | WHATSAPP | IMPORT. `Transaction.notes` (≤500 chars) is a free-text observation, editable in the transaction dialog and the import review (prefilled "Cartão final XXXX" for additional cards on the bill).
- **WhatsApp Float Button** — Floating contact button on landing and subscription pages
- **PDF Export** — Credit card installments and transactions exportable as PDF (jspdf + jspdf-autotable). Respects card filter.
- **PWA** — Installable as mobile app. SW handles only push notifications (no fetch interception — breaks Clerk auth). `SignInButton mode="modal"` for login without leaving PWA.
- **OG Image** — Generated in code with `next/og`: `app/opengraph-image.tsx` (site) and `app/guias/[slug]/opengraph-image.tsx` (one per guide, with its title). Shared brand pieces + Noto Sans fonts in `app/_lib/og.tsx` / `app/_lib/fonts/`. Social media versions (same pieces) at `/social/feed` (1080×1350) and `/social/story` (1080×1920), `app/social/[format]/route.tsx`. `/opengraph-image(.*)` and `/social(.*)` must stay public in the middleware
- **Theme Toggle** — Dark/light mode via `next-themes`. Toggle in navbar. Clerk and Toaster react dynamically. Default: dark. Preference saved in localStorage.
- **Card Logos** — Brand logos (Visa, Mastercard, Elo, Amex, Hipercard) in `public/brands/`. Bank logos (Nubank, Santander, Itaú, etc.) in `public/banks/`. Mapped via `CARD_BRAND_ICONS` and `getBankIcon()` in `_constants/credit-cards.ts`.
- **Payment Status** — "Contas fixas" dashboard card (paid vs pending progress). Only counts recurring expenses (not CC bills — those have their own cards). Data from `app/_data/get-payment-status`.

### Patterns

- **Server Components by default** — pages fetch data directly with `db`
- **Decimal serialization** — Prisma returns `Decimal` objects. Convert to `number` before passing to Client Components
- **Server Actions** — Validated with Zod schemas, authenticated via `getEffectiveUserId()`, call `revalidatePath` after mutations
- **UI components** — Based on shadcn/ui (Radix + CVA + Tailwind). Dark/light theme via next-themes
- **Chart colors** — Dashboard series use `--viz-income`, `--viz-expense`, `--viz-card`, `--viz-invest` (plus `--viz-grid`, `--viz-track`) from `globals.css`, with separate light/dark values validated for colorblind separation. Don't hardcode hex in charts
- **Theme colors** — Use CSS variables (`text-foreground`, `bg-muted`, `border-border`) not hardcoded colors (`text-white`, `bg-white/10`). Exception: credit-card-item uses `text-white` over colored gradients
- **Path alias** — `@/*` maps to project root
- **Brazil timezone** — `instrumentation.ts` sets `process.env.TZ = "America/Sao_Paulo"` at server start (Vercel runs in UTC), so server `getDate()` / `new Date(y, m, d)` are Brasília time. Never build dates from ISO strings like `"2026-10-01"` (parsed as UTC midnight = 21h of the day before in Brasília)
- **Period (month + year)** — Month-filtered pages use `?month=YYYY-MM` (legacy `?month=MM` redirects to the current year). Parse/format with `app/_utils/period.ts` (`parsePeriod`, `toPeriod`, `periodRange`, `shiftPeriod`); data functions take the `"YYYY-MM"` string. Never assume `new Date().getFullYear()` for a selected month
- **Credit card architecture** — CC purchases are EXPENSE transactions stored on the **real purchase date** (never shift dates). Installment N is dated N-1 months after the purchase (`installmentDates`). Which bill a purchase belongs to comes from the card's **BillCalendar** (`app/_utils/credit-card-bill.ts`, loaded with `loadBillCalendars()` in `app/_lib/bill-calendar.ts`): bills with `CreditCardBill.datesLocked` (imported from the bank's PDF, or frozen the first time the bills page sees them closed) keep their real closing/due dates; other bills are computed from the card's current closingDay/dueDay. Changing the closing day therefore never moves past purchases. Computed bills that would close/be due no later than the previous known bill are "phantoms" (empty) — this handles the bank moving the closing day across a month boundary. Never compute bill windows from `closingDay` directly; always go through the calendar. Bill payment is a separate action that doesn't create duplicate expenses.
- **Two views of money** — "Gastos do mês" / categories / budget use purchase date (competência: cash + card purchases in the month). "Saldo do mês" is cash: receita − despesas à vista − investido − card bills **marked as PAID** whose due date is in the month (`paidBillsTotal`). Unpaid bills never reduce the balance.

### Database

- Local dev uses Docker PostgreSQL (container: `finance-ai-database`, port 5432)
- Production: Neon PostgreSQL
- Connection string in `.env` as `DATABASE_URL`
- Do NOT upgrade to Prisma 7 — Studio has breaking bugs with the adapter-based API

### Auth

- Clerk handles all authentication
- `userId` is obtained via `getEffectiveUserId()` which supports account sharing
- Middleware uses `createRouteMatcher` + `auth.protect()` for route protection
- Public routes: `/`, `/login`, `/manifest.json`, `/robots.txt`, `/sitemap.xml`, `/opengraph-image(.*)`, `/social(.*)`, `/guias(.*)`, `/sw.js`, `/__clerk(.*)`, webhooks, cron. robots/sitemap MUST stay public or search engines get a 404
- SEO: public URL/title/description in `app/_lib/site.ts` (used by layout metadata, robots, sitemap). Landing page emits JSON-LD (SoftwareApplication + FAQPage built from its FAQ array)
- **IMPORTANT**: `/__clerk(.*)` and `/manifest.json` MUST be public — Clerk needs internal routes for session management, manifest is required for PWA install
- **IMPORTANT**: Do NOT add fetch handlers to the service worker — intercepting navigation/requests breaks Clerk session detection in PWA
- All protected pages redirect to `/` (not `/login`) when unauthenticated
- Environment vars: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`

### Payments

- **Stripe** — Monthly subscription (card) and lifetime checkout (card)
- **Mercado Pago** — PIX payment for lifetime plan. SDK `mercadopago`, webhook at `/api/webhooks/mercadopago`
- **Telegram Bot** — Notifies owner on PIX payment received (via bot API, no SDK)
- **Evolution API** — WhatsApp integration for transaction registration. Instance on VPS (212.56.33.113:8080), webhook sends messages to `/api/webhooks/evolution`
- **VPS Cron** — Crontab on VPS (212.56.33.113, timezone America/Sao_Paulo) runs `0 9 * * *` (9h BRT). Requires `CRON_SECRET` env var.
- Subscription state managed via Clerk metadata (`publicMetadata.subscriptionPlan`, `privateMetadata.lifetimePurchase`)

### Pricing

- **Free**: 15 transactions/month, 1 statement import/month (≤50 lines), dashboard, credit cards, budgets, recurring expenses, shopping list
- **Premium (R$14,99/mês)**: Unlimited transactions, AI reports, account sharing, custom categories, WhatsApp transactions, WhatsApp reminders
- **Lifetime (R$14,99 único)**: Same as premium, one-time payment via Stripe (card) or Mercado Pago (PIX)
