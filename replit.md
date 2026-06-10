# Smart Attendance Management System

A full-stack web app for educational institutions to automate attendance tracking with role-based dashboards for admin, faculty, and students.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/attendance-app run dev` — run the frontend (port 19377)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, Recharts, Wouter routing
- API: Express 5 with JWT auth (bcryptjs + jsonwebtoken)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — DB schema: `users.ts`, `subjects.ts`, `attendance.ts`
- `artifacts/api-server/src/routes/` — Express route handlers (auth, students, faculty, subjects, attendance, analytics)
- `artifacts/attendance-app/src/` — React frontend with pages for admin/faculty/student roles

## Architecture decisions

- Single `users` table with a `role` enum (`admin`, `faculty`, `student`) — no separate collections per role
- JWT stored in localStorage; `custom-fetch.ts` injects `Authorization: Bearer <token>` on every request
- Attendance upsert: delete then insert (avoids unique constraint complexity; session-level atomicity is sufficient)
- Attendance percentage counts both `Present` and `Late` as attended; `Absent` reduces percentage
- PostgreSQL used in place of MongoDB (spec requirement) — Drizzle ORM is already wired in the workspace

## Product

Three-role attendance platform:
- **Admin**: user/subject management, system-wide analytics dashboard
- **Faculty**: digital attendance marking (bulk + individual), subject analytics, low-attendance alerts
- **Student**: personal attendance dashboard with subject-wise % bars (red warning below 75%)

## Demo credentials

| Role    | Email                     | Password     |
|---------|---------------------------|--------------|
| Admin   | admin@demo.edu            | admin123     |
| Faculty | sarah.johnson@demo.edu    | faculty123   |
| Student | alice@demo.edu            | student123   |

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm run typecheck:libs` after any `lib/*` schema change before running `pnpm --filter @workspace/api-server run typecheck`
- After changing `openapi.yaml`, run codegen before touching routes: `pnpm --filter @workspace/api-spec run codegen`
- Do not run `pnpm dev` at workspace root — use individual `--filter` commands

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
