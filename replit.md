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

## Deployment

Configured as `vm` (long-running) so the Express backend stays up:

- Build: `pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server build && PORT=5000 BASE_PATH=/ pnpm --filter @workspace/aleajayhi build`
- Run: starts the API server on 3001 in the background and `vite preview` on 5000 (which proxies `/api` to 3001).
