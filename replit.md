# Aleajaybi Travel - Driving School Booking System

## Overview

A web-based booking system for Aleajaybi Travel driving school. Students can book driving lessons (manual or automatic transmission), submit payment proof, and receive WhatsApp notifications. Trainers have an admin dashboard to manage and confirm bookings.

## Architecture

**Monorepo** using `pnpm` workspaces with the following structure:

```
artifacts/
  aleajayhi/       # React 19 + Vite frontend (port 5000 in dev)
  api-server/      # Express 5 backend API (port 3001 in dev)
lib/
  api-client-react/  # Generated TanStack Query hooks (from OpenAPI)
  api-spec/          # OpenAPI 3.1 YAML definition + Orval config
  api-zod/           # Generated Zod schemas (from OpenAPI)
  db/                # Drizzle ORM schema + PostgreSQL connection
```

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4, Shadcn UI, Framer Motion, Wouter, TanStack Query
- **Backend**: Node.js, Express 5, TypeScript, Pino logging, Zod validation
- **Database**: PostgreSQL (Replit built-in), Drizzle ORM
- **API**: OpenAPI 3.1 spec with Orval code generation

## Development Workflows

- **Start application** (webview, port 5000): Runs the Vite dev server for the frontend
- **Backend API** (console, port 3001): Builds and starts the Express API server

### Environment Variables

- `PORT` - Required for both frontend and backend
- `BASE_PATH` - Required for frontend (`/`)
- `API_PROXY_TARGET` - Frontend proxy target for API calls (defaults to `http://localhost:3001`)
- `DATABASE_URL` / `PG*` - PostgreSQL connection (set by Replit database provisioning)

## Database Schema

- **cars** - Available cars (id, name, model, transmission, image_url, description)
- **bookings** - Lesson bookings with payment tracking (unique slot constraint on car+week+day+time)

## Key Features

- Student portal: browse cars, view pricing, check slot availability, book lessons
- Payment submission: Vodafone Cash / InstaPay payment proof upload
- Admin dashboard: trainer portal to review/confirm/reject bookings
- WhatsApp notifications for booking status updates

## Admin Access

The admin dashboard is accessible at `/admin`. It requires an `ADMIN_TOKEN` environment variable to be set on the server. The token is submitted via the login page and sent as `x-admin-token` header in subsequent requests.

- **Admin token env var**: `ADMIN_TOKEN` (set in shared environment secrets)
- **Admin login**: Available at the `/admin` route in the frontend

## Car Data

Cars are seeded in the database. Run the seed script if the DB is fresh:
```bash
pnpm --filter @workspace/db run seed
```

- **Car 1**: نيسان صاني (Nissan Sunny) — Manual — `/cars/nissan-sunny.jpg`
- **Car 2**: فيات 128 (Fiat 128) — Automatic — `/cars/fiat-128.jpg`

Car images are stored in `artifacts/aleajayhi/public/cars/` and referenced via URL paths.
Source images are in `attached_assets/` and imported via the `@assets` Vite alias.

## Payment Configuration

Optional environment variables (defaults provided in `pricing.ts`):
- `VODAFONE_CASH_NUMBER` — defaults to `01017979651`
- `INSTAPAY_HANDLE` — defaults to `aleajaybi@instapay`

## Deployment

Configured as `autoscale` deployment. Build step compiles both frontend and backend; run command starts the API server in production mode.
