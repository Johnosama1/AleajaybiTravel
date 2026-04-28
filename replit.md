# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## GitHub
The user requested pushing the code to GitHub on 2026-04-28 but dismissed the GitHub connection prompt. To enable GitHub push later, search for the GitHub connector and propose it again to the user. No GitHub credentials are stored.

## Per-Car Booking Model (2026-04-28)
- Bookings are per-car: `bookings.car_id` + unique index on (car_id, week_start, day_of_week, hour).
- Schedule split by transmission: manual cars on Sat/Mon/Wed (days 0,2,4), automatic cars on Sun/Tue/Thu (days 1,3,5). Hours 9-20.
- `/availability` requires both `weekStart` and `carId`.
- Server validates dayOfWeek matches the chosen car's transmission and that hour is in HOURS.
- Frontend: click a car card on Home → opens `CarBookingDialog` (Dialog) with day picker → hour picker → name/phone form → opens WhatsApp.
- Routes: `/` (Home), `/taken` (الحجز المأخوذ - all bookings list with privacy-masked names/phones), `/contact`.
- Header has hamburger menu (Sheet) — logo+name on LEFT, menu icon on RIGHT.
- Brand renamed to "Aleajaybi Travel" (مدرسة العجايبي).
