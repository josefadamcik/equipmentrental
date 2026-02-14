# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Equipment Rental System — a full-stack monorepo with an Express backend using **Hexagonal Architecture** (Ports & Adapters) and a React SPA frontend.

## Commands

All commands run from repo root. Use `-w @equipmentrental/backend` or `-w @equipmentrental/frontend` to target a specific package.

### Development
```bash
npm run dev              # Start both backend (port 3000) and frontend (port 5173)
npm run dev:backend      # Backend only with hot reload (tsx watch)
npm run dev:frontend     # Frontend only (Vite)
```

### Build / Lint / Typecheck
```bash
npm run build            # Build all packages
npm run lint             # Lint all packages
npm run typecheck        # Type-check all packages
```

### Testing (backend only — frontend has no test runner)
```bash
npm test -w @equipmentrental/backend              # Run all tests
npm run test:watch -w @equipmentrental/backend     # Watch mode
npm run test:coverage -w @equipmentrental/backend  # With coverage
# Run a single test file:
npx jest --passWithNoTests src/domain/__tests__/equipment.test.ts -w @equipmentrental/backend
```

Jest uses ts-jest ESM preset with path alias mapping (`@domain/*`, `@application/*`, `@adapters/*`, `@infrastructure/*`).

### Database
```bash
npx prisma migrate dev -w @equipmentrental/backend    # Run migrations
npx prisma generate -w @equipmentrental/backend       # Generate client
```

Local dev uses SQLite (`file:./dev.db`); production uses PostgreSQL 16.

## Architecture

### Monorepo
npm workspaces with two packages: `packages/backend` and `packages/frontend`.

### Backend — Hexagonal Architecture

The backend enforces strict layer separation. The domain layer has **zero external dependencies**.

- **Domain** (`src/domain/`) — Entities (Equipment, Member, Rental, Reservation, DamageAssessment), value objects (Money, DateRange, type-safe IDs), ports (repository interfaces), domain events, exceptions, and types (MembershipTier, RentalStatus, EquipmentCondition).
- **Application** (`src/application/`) — Commands (CreateRental, ReturnRental, ExtendRental…), queries (GetAvailableEquipment, GetRental…), and services that orchestrate domain logic.
- **Adapters** (`src/adapters/`) — Inbound: Express controllers + Zod validation DTOs. Outbound: Prisma repositories (production), in-memory repositories (testing), Stripe/mock payment, email/console notification.
- **Infrastructure** (`src/infrastructure/`) — DI container, config, Winston logging.

Path aliases in tsconfig: `@domain/*`, `@application/*`, `@adapters/*`, `@infrastructure/*`.

### Frontend — React SPA

React 19 + React Router 7 + Tailwind CSS 4 + Vite. The `@/*` path alias maps to `src/`. API calls go through a typed client in `src/api/`. The Vite dev server proxies `/api` requests to the backend.

### API Endpoints

Base routes: `/api/equipment`, `/api/members`, `/api/rentals`, `/api/reservations`. Health check at `/health`. Swagger docs at `/api-docs`.

## Key Configuration

- **TypeScript**: Strict mode, ES2022 target, shared base config at `tsconfig.base.json`
- **Prettier**: Single quotes, trailing commas, 100 char width, 2-space indent
- **ESLint**: TypeScript strict rules on backend, React hooks/refresh on frontend
- **Docker**: Multi-stage builds for both packages; `docker-compose.yml` for local dev with PostgreSQL + Redis + Adminer
- **CI**: GitHub Actions runs lint, typecheck, test (Node 20 & 22), build, and integration tests
