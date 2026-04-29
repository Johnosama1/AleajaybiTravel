# Aleajaybi Travel — Driving School

Arabic-language website for a driving school, with a booking system. The app is a TypeScript/pnpm monorepo:

- `artifacts/aleajayhi` — React + Vite frontend (port 5000)
- `artifacts/api-server` — Express API server (port 3001)
- `artifacts/mockup-sandbox` — Component sandbox (not run by default)
- `lib/db` — Drizzle ORM schema + Postgres connection
- `lib/api-spec` — OpenAPI spec, single source of truth
- `lib/api-zod` / `lib/api-client-react` — Generated server-side schemas and React Query client

## How it runs in Replit

Two workflows:

- **Frontend** — `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/aleajayhi dev`
  Vite dev server, host `0.0.0.0`, all hosts allowed (preview is iframed). Proxies `/api/*` to the backend at `http://localhost:3001` (overridable via `API_PROXY_TARGET`).
- **Backend** — `PORT=3001 pnpm --filter @workspace/api-server start`
  Express server reading `DATABASE_URL`. Built via esbuild (`pnpm --filter @workspace/api-server build`).

## Database

- Uses Replit's built-in Postgres (`DATABASE_URL`).
- Schema lives in `lib/db/src/schema` and is pushed with `pnpm --filter @workspace/db push`.
- The `cars` table is seeded with two starter rows (Nissan Sunny manual, Fiat 128 automatic) so the homepage list isn't empty.
- The `bookings` table includes payment fields: `priceEgp` (default 10), `sessionsCount` (default 4), `paymentStatus` (`pending` → `submitted` → `paid`), `paymentMethod` (`vodafone_cash` | `instapay`), `paymentReference`, `paidAt`.

## Payment + admin flow

The booking flow is "practical": no real payment-gateway integration (the user is on the free tier and chose Vodafone Cash / InstaPay manual reconciliation).

1. Customer picks a car + slot in the home page → submits the booking form. Frontend redirects to `/booking/:id`.
2. `/booking/:id` shows the booking summary, Vodafone Cash number / InstaPay handle (from `GET /api/pricing`), and a form to enter the transfer reference. Submitting calls `POST /api/bookings/:id/payment` and the page polls `GET /api/bookings/:id` every 4s until `paymentStatus === "paid"`.
3. The trainer logs into `/admin` with `ADMIN_TOKEN` (sent via `X-Admin-Token` header). They see a tabbed dashboard (للمراجعة / مؤكدة / لم يدفع), and pressing "تأكيد + إرسال واتساب" calls `POST /api/admin/bookings/:id/confirm`, marks the booking paid, and opens a prefilled `wa.me` link with all booking details to the trainer's WhatsApp number.
4. Trainer can also reject a submitted payment (`POST /api/admin/bookings/:id/reject`), which resets it back to `pending`.

### Configuration

- `ADMIN_TOKEN` (secret, required) — password the trainer uses to log into `/admin`.
- `VODAFONE_CASH_NUMBER` (env, optional, default `01099399666`) — wallet number shown on the payment page.
- `INSTAPAY_HANDLE` (env, optional, default `aleajaybi@instapay`) — InstaPay handle shown on the payment page.
- `WHATSAPP_PHONE` (env, optional, default `201099399666`) — trainer's WhatsApp number used for the auto-opened confirmation link (in `routes/schedule.ts`).
- Pricing is fixed in code at `PRICE_EGP = 10`, `SESSIONS_COUNT = 4` (`routes/pricing.ts`).

## Deployment

Configured as `vm` (long-running) so the Express backend stays up:

- Build: `pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server build && PORT=5000 BASE_PATH=/ pnpm --filter @workspace/aleajayhi build`
- Run: starts the API server on 3001 in the background and `vite preview` on 5000 (which proxies `/api` to 3001).
