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
- `app/budget/` — Monthly budget by category
- `app/recurring/` — Recurring expenses management (CRUD, pay, toggle)
- `app/categories/` — Custom categories management
- `app/subscription/` — Plans page (free vs premium)
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
- **AccountShare / AccountShareInvite** — Account sharing between users
- **RecurringExpense** — Fixed monthly expenses (rent, utilities) with due day, active/inactive, linked transactions for payment tracking
- **WhatsAppLink** — Links a user's phone number to their account for WhatsApp transactions
- **WhatsAppSession** — Tracks multi-step conversation state and message dedup locks

### Key Features

- **Landing Page** — Route `/` shows landing page for unauthenticated visitors, dashboard for logged users
- **Credit Card Bills** — Auto-created per card/month, status transitions: OPEN → CLOSED → PAID/OVERDUE based on closing/due dates. No duplicate transactions on bill payment.
- **Installments** — Up to 48x, creates N transactions with divided amounts spread monthly
- **AI Reports** — OpenAI-powered financial analysis with transactions, budgets, credit cards, bills data. Structured prompt with scoring.
- **Account Sharing** — Share financial data with a partner via invite system
- **PIX Payment** — Mercado Pago integration for lifetime plan. QR code modal on subscription page, webhook with HMAC validation, Telegram notification on payment received.
- **Recurring Expenses** — Fixed monthly bills (rent, utilities, internet). CRUD with category, due day, active/inactive toggle. "Pay" button creates a real Transaction linked via `recurringExpenseId`. Badge shows Paid/Pending per month. Dashboard widget shows upcoming due dates (next 7 days, excludes paid).
- **Recurring Reminders** — VPS Cron (`0 9 * * *` BRT on 212.56.33.113) calls `/api/cron/recurring-reminders`. Sends WhatsApp + push notification to users with unpaid expenses due today. Protected with `CRON_SECRET`.
- **Push Notifications** — VAPID web push via `web-push` package. Auto-resubscribes on PWA reinstall. Model `PushSubscription` in Prisma.
- **WhatsApp Transactions** — Register transactions via WhatsApp using Evolution API. Webhook at `/api/webhooks/evolution`. Supports credit card selection, installments, multi-step conversation. Settings page at `/settings` to link/unlink phone number.
- **WhatsApp Float Button** — Floating contact button on landing and subscription pages
- **PDF Export** — Credit card installments and transactions exportable as PDF (jspdf + jspdf-autotable). Respects card filter.
- **PWA** — Installable as mobile app. SW handles only push notifications (no fetch interception — breaks Clerk auth). `SignInButton mode="modal"` for login without leaving PWA.
- **OG Image** — 1200x630 dashboard preview for link sharing

### Patterns

- **Server Components by default** — pages fetch data directly with `db`
- **Decimal serialization** — Prisma returns `Decimal` objects. Convert to `number` before passing to Client Components
- **Server Actions** — Validated with Zod schemas, authenticated via `getEffectiveUserId()`, call `revalidatePath` after mutations
- **UI components** — Based on shadcn/ui (Radix + CVA + Tailwind). Dark theme only
- **Path alias** — `@/*` maps to project root
- **Brazil timezone** — All date calculations for recurring expenses use `America/Sao_Paulo` (Vercel runs in UTC)

### Database

- Local dev uses Docker PostgreSQL (container: `finance-ai-database`, port 5432)
- Production: Neon PostgreSQL
- Connection string in `.env` as `DATABASE_URL`
- Do NOT upgrade to Prisma 7 — Studio has breaking bugs with the adapter-based API

### Auth

- Clerk handles all authentication
- `userId` is obtained via `getEffectiveUserId()` which supports account sharing
- Middleware uses `createRouteMatcher` + `auth.protect()` for route protection
- Public routes: `/`, `/login`, `/manifest.json`, `/sw.js`, `/__clerk(.*)`, webhooks, cron
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

- **Free**: 15 transactions/month, dashboard, credit cards, budgets, recurring expenses
- **Premium (R$14,99/mês)**: Unlimited transactions, AI reports, account sharing, custom categories, WhatsApp transactions, WhatsApp reminders
- **Lifetime (R$14,99 único)**: Same as premium, one-time payment via Stripe (card) or Mercado Pago (PIX)
