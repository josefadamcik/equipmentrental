# Project Structure Reference

## Monorepo Layout

This is an **npm workspaces monorepo** with two packages:

```
equipmentrental/
├── packages/
│   ├── backend/                             # Node.js + Express API (Hexagonal Architecture)
│   │   ├── src/
│   │   │   ├── domain/                      # Core Business Logic (Zero Dependencies)
│   │   │   │   ├── entities/
│   │   │   │   │   ├── Equipment.ts         # Rental items with availability tracking
│   │   │   │   │   ├── Rental.ts            # Central aggregate for rental lifecycle
│   │   │   │   │   ├── Member.ts            # Customers with membership tiers
│   │   │   │   │   ├── Reservation.ts       # Future booking system
│   │   │   │   │   └── DamageAssessment.ts  # Equipment condition evaluation
│   │   │   │   ├── value-objects/
│   │   │   │   │   ├── Money.ts             # Integer-cent monetary amounts
│   │   │   │   │   ├── DateRange.ts         # Time periods with overlap detection
│   │   │   │   │   └── identifiers.ts       # Type-safe IDs (EquipmentId, RentalId, etc.)
│   │   │   │   ├── ports/                   # Interface definitions (contracts)
│   │   │   │   │   ├── EquipmentRepository.ts
│   │   │   │   │   ├── MemberRepository.ts
│   │   │   │   │   ├── RentalRepository.ts
│   │   │   │   │   ├── ReservationRepository.ts
│   │   │   │   │   ├── PaymentService.ts
│   │   │   │   │   ├── PaymentIntentRepository.ts
│   │   │   │   │   ├── NotificationService.ts
│   │   │   │   │   └── EventPublisher.ts
│   │   │   │   ├── events/
│   │   │   │   │   ├── DomainEvent.ts
│   │   │   │   │   ├── RentalEvents.ts
│   │   │   │   │   ├── ReservationEvents.ts
│   │   │   │   │   └── EquipmentEvents.ts
│   │   │   │   ├── types/
│   │   │   │   │   ├── RentalStatus.ts
│   │   │   │   │   ├── EquipmentCondition.ts
│   │   │   │   │   └── MembershipTier.ts
│   │   │   │   └── exceptions/
│   │   │   │       ├── DomainException.ts
│   │   │   │       ├── RentalExceptions.ts
│   │   │   │       ├── EquipmentExceptions.ts
│   │   │   │       ├── MemberExceptions.ts
│   │   │   │       └── ReservationExceptions.ts
│   │   │   │
│   │   │   ├── application/                 # Use Cases and Orchestration
│   │   │   │   ├── commands/
│   │   │   │   │   ├── rental/
│   │   │   │   │   │   ├── CreateRentalCommand.ts
│   │   │   │   │   │   ├── ReturnRentalCommand.ts
│   │   │   │   │   │   └── ExtendRentalCommand.ts
│   │   │   │   │   ├── reservation/
│   │   │   │   │   │   ├── CreateReservationCommand.ts
│   │   │   │   │   │   └── CancelReservationCommand.ts
│   │   │   │   │   └── damage/
│   │   │   │   │       └── AssessDamageCommand.ts
│   │   │   │   ├── queries/
│   │   │   │   │   ├── GetAvailableEquipmentQuery.ts
│   │   │   │   │   ├── GetRentalQuery.ts
│   │   │   │   │   ├── GetMemberRentalsQuery.ts
│   │   │   │   │   ├── GetOverdueRentalsQuery.ts
│   │   │   │   │   └── GetEquipmentMaintenanceScheduleQuery.ts
│   │   │   │   └── services/
│   │   │   │       ├── RentalService.ts
│   │   │   │       └── ReservationService.ts
│   │   │   │
│   │   │   ├── adapters/                    # External Interface Implementations
│   │   │   │   ├── inbound/
│   │   │   │   │   └── http/
│   │   │   │   │       ├── server.ts        # Express server setup
│   │   │   │   │       ├── controllers/
│   │   │   │   │       │   ├── EquipmentController.ts
│   │   │   │   │       │   ├── MemberController.ts
│   │   │   │   │       │   ├── RentalController.ts
│   │   │   │   │       │   └── ReservationController.ts
│   │   │   │   │       ├── dtos/
│   │   │   │   │       │   ├── EquipmentDTOs.ts
│   │   │   │   │       │   ├── MemberDTOs.ts
│   │   │   │   │       │   ├── RentalDTOs.ts
│   │   │   │   │       │   ├── ReservationDTOs.ts
│   │   │   │   │       │   └── ErrorDTOs.ts
│   │   │   │   │       ├── middleware/
│   │   │   │   │       │   └── errorHandler.ts
│   │   │   │   │       └── validation/
│   │   │   │   │           ├── schemas.ts   # Zod validation schemas
│   │   │   │   │           └── middleware.ts # Zod validation middleware
│   │   │   │   │
│   │   │   │   └── outbound/
│   │   │   │       ├── persistence/
│   │   │   │       │   ├── InMemoryEquipmentRepository.ts
│   │   │   │       │   ├── InMemoryMemberRepository.ts
│   │   │   │       │   ├── InMemoryRentalRepository.ts
│   │   │   │       │   ├── InMemoryReservationRepository.ts
│   │   │   │       │   ├── InMemoryPaymentIntentRepository.ts
│   │   │   │       │   ├── PrismaEquipmentRepository.ts
│   │   │   │       │   ├── PrismaMemberRepository.ts
│   │   │   │       │   ├── PrismaRentalRepository.ts
│   │   │   │       │   ├── PrismaReservationRepository.ts
│   │   │   │       │   └── PrismaPaymentIntentRepository.ts
│   │   │   │       ├── payment/
│   │   │   │       │   ├── MockPaymentService.ts
│   │   │   │       │   └── StripePaymentService.ts
│   │   │   │       ├── notification/
│   │   │   │       │   ├── ConsoleNotificationService.ts
│   │   │   │       │   └── EmailNotificationService.ts
│   │   │   │       └── events/
│   │   │   │           └── InMemoryEventPublisher.ts
│   │   │   │
│   │   │   ├── infrastructure/              # Cross-Cutting Concerns
│   │   │   │   ├── config/
│   │   │   │   │   ├── Config.ts
│   │   │   │   │   ├── DatabaseConfig.ts
│   │   │   │   │   └── ServerConfig.ts
│   │   │   │   ├── logging/
│   │   │   │   │   ├── Logger.ts
│   │   │   │   │   └── RequestLogger.ts
│   │   │   │   ├── di/
│   │   │   │   │   ├── Container.ts         # Dependency injection container
│   │   │   │   │   └── types.ts             # DI token definitions
│   │   │   │   └── swagger/
│   │   │   │       ├── swagger.config.ts
│   │   │   │       └── openapi.yaml
│   │   │   │
│   │   │   └── index.ts                     # Application entry point
│   │   │
│   │   ├── prisma/
│   │   │   ├── schema.prisma                # Database models
│   │   │   └── migrations/                  # SQL migration files
│   │   ├── Dockerfile                       # Multi-stage: development + production
│   │   ├── jest.config.ts
│   │   ├── tsconfig.json
│   │   ├── eslint.config.mjs
│   │   └── package.json
│   │
│   └── frontend/                            # React + Vite SPA
│       ├── src/
│       │   ├── main.tsx                     # React entry point
│       │   ├── App.tsx                      # Root component with RouterProvider
│       │   ├── router.tsx                   # React Router route definitions
│       │   ├── index.css                    # Tailwind CSS imports
│       │   │
│       │   ├── types/
│       │   │   └── api.ts                   # TypeScript interfaces matching backend DTOs
│       │   │
│       │   ├── api/                         # Typed API client
│       │   │   ├── client.ts                # Base fetch wrapper with error handling
│       │   │   ├── equipment.ts
│       │   │   ├── members.ts
│       │   │   ├── rentals.ts
│       │   │   └── reservations.ts
│       │   │
│       │   ├── hooks/
│       │   │   └── useApi.ts                # Generic data fetching hook
│       │   │
│       │   ├── layouts/
│       │   │   └── AppLayout.tsx            # Responsive sidebar + header + Outlet
│       │   │
│       │   ├── components/
│       │   │   ├── Header.tsx
│       │   │   ├── Sidebar.tsx
│       │   │   ├── dashboard/
│       │   │   │   ├── StatCard.tsx
│       │   │   │   ├── RecentActivityList.tsx
│       │   │   │   └── EquipmentAvailabilityChart.tsx
│       │   │   ├── equipment/
│       │   │   │   ├── EquipmentTable.tsx
│       │   │   │   ├── EquipmentFilters.tsx
│       │   │   │   └── EquipmentStatusBadge.tsx
│       │   │   ├── members/
│       │   │   │   ├── MemberTable.tsx
│       │   │   │   ├── MemberFilters.tsx
│       │   │   │   └── TierBadge.tsx
│       │   │   ├── rentals/
│       │   │   │   ├── RentalTable.tsx
│       │   │   │   ├── RentalStatusBadge.tsx
│       │   │   │   ├── ReturnRentalDialog.tsx
│       │   │   │   └── ExtendRentalDialog.tsx
│       │   │   └── reservations/
│       │   │       ├── ReservationTable.tsx
│       │   │       └── ReservationStatusBadge.tsx
│       │   │
│       │   └── pages/
│       │       ├── DashboardPage.tsx
│       │       ├── EquipmentListPage.tsx
│       │       ├── EquipmentDetailPage.tsx
│       │       ├── EquipmentFormPage.tsx
│       │       ├── MembersListPage.tsx
│       │       ├── MemberDetailPage.tsx
│       │       ├── MemberFormPage.tsx
│       │       ├── RentalsPage.tsx
│       │       ├── CreateRentalPage.tsx
│       │       ├── RentalDetailPage.tsx
│       │       ├── ReservationsPage.tsx
│       │       ├── CreateReservationPage.tsx
│       │       └── ReservationDetailPage.tsx
│       │
│       ├── index.html
│       ├── nginx.conf                       # Production nginx (SPA fallback + API proxy)
│       ├── Dockerfile                       # Multi-stage: node build → nginx
│       ├── vercel.json                      # Vercel deployment config
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── eslint.config.mjs
│       └── package.json
│
├── docker-compose.yml                       # Development (hot reload, Adminer, exposed ports)
├── docker-compose.prod.yml                  # Production (nginx frontend, resource limits)
├── package.json                             # Workspace root
│
├── README.md
├── ARCHITECTURE.md
├── NEXT_STEPS.md
└── PROJECT_STRUCTURE.md                     # This file
```

## Layer Dependencies (Dependency Rule)

```
┌─────────────────────────────────────────────────────────────┐
│  Adapters/Infrastructure  (Depends on: Application, Domain) │
│  - HTTP Controllers                                         │
│  - Database Repositories                                    │
│  - Payment Gateways                                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Application          (Depends on: Domain only)             │
│  - Use Cases                                                │
│  - Commands/Queries                                         │
│  - Services                                                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Domain               (Depends on: Nothing!)                │
│  - Entities                                                 │
│  - Value Objects                                            │
│  - Business Rules                                           │
└─────────────────────────────────────────────────────────────┘
```

**Key Rule**: Inner layers never depend on outer layers!

## File Naming Conventions

### Domain Layer
- **Entities**: `PascalCase.ts` (e.g., `Equipment.ts`, `Rental.ts`)
- **Value Objects**: `PascalCase.ts` (e.g., `Money.ts`, `DateRange.ts`)
- **Ports**: `PascalCaseInterface.ts` (e.g., `EquipmentRepository.ts`)
- **Events**: `PascalCaseEvents.ts` (e.g., `RentalEvents.ts`)
- **Exceptions**: `PascalCaseExceptions.ts` (e.g., `RentalExceptions.ts`)

### Application Layer
- **Commands**: `VerbNounCommand.ts` (e.g., `CreateRentalCommand.ts`)
- **Queries**: `GetNounQuery.ts` (e.g., `GetAvailableEquipmentQuery.ts`)
- **Services**: `NounService.ts` (e.g., `RentalService.ts`)

### Adapters Layer
- **Controllers**: `NounController.ts` (e.g., `RentalController.ts`)
- **DTOs**: `NounDTOs.ts` (e.g., `RentalDTOs.ts`)
- **Repositories**: `TechnologyNounRepository.ts` (e.g., `PrismaRentalRepository.ts`)
- **Services**: `TechnologyNounService.ts` (e.g., `StripePaymentService.ts`)

### Frontend
- **Pages**: `NounPage.tsx` (e.g., `DashboardPage.tsx`, `EquipmentListPage.tsx`)
- **Components**: `PascalCase.tsx` (e.g., `EquipmentTable.tsx`, `TierBadge.tsx`)
- **API modules**: `camelCase.ts` (e.g., `equipment.ts`, `members.ts`)
- **Hooks**: `useNoun.ts` (e.g., `useApi.ts`)

### Tests
- **Unit tests**: `FileName.test.ts` (in `__tests__/` next to source)
- **Integration tests**: `FileName.integration.test.ts`
- **E2E tests**: `feature-name.test.ts` (in `src/__tests__/e2e/`)

## Import Path Aliases

### Backend (`packages/backend/tsconfig.json`)

```typescript
import { Money } from '@domain/value-objects/Money';
import { CreateRentalCommand } from '@application/commands/rental/CreateRentalCommand';
import { RentalController } from '@adapters/inbound/http/controllers/RentalController';
import { Container } from '@infrastructure/di/Container';
```

### Frontend (`packages/frontend/tsconfig.json`)

```typescript
import { equipmentApi } from '@/api/equipment';
import { useApi } from '@/hooks/useApi';
import { EquipmentTable } from '@/components/equipment/EquipmentTable';
import type { Equipment } from '@/types/api';
```

## Test File Organization

```
packages/backend/src/
├── domain/
│   ├── entities/
│   │   ├── Rental.ts
│   │   └── __tests__/
│   │       └── Rental.test.ts                    # Unit test
│   └── value-objects/
│       ├── Money.ts
│       └── __tests__/
│           └── Money.test.ts                     # Unit test
│
├── application/
│   └── commands/
│       └── __tests__/
│           ├── CreateRentalCommandHandler.test.ts # Unit test
│           └── integration/
│               └── CommandHandlers.integration.test.ts
│
├── adapters/
│   └── outbound/
│       └── persistence/
│           └── __tests__/
│               └── InMemoryEquipmentRepository.test.ts
│
└── __tests__/
    └── e2e/
        ├── setup.ts
        ├── rental-flow.test.ts
        ├── return-flow.test.ts
        ├── reservation-flow.test.ts
        └── error-scenarios.test.ts
```

## Configuration Files

### Root
- **`package.json`**: Workspace root with `"workspaces": ["packages/*"]`
  - Aggregate scripts: `build`, `test`, `lint`, `typecheck`, `dev`

### Backend (`packages/backend/`)
- **`tsconfig.json`**: TypeScript (ES2022, CommonJS, path aliases, strict mode)
- **`jest.config.ts`**: Jest with ts-jest, path alias mapping, coverage config
- **`eslint.config.mjs`**: ESLint v9 flat config with TypeScript rules
- **`.prettierrc`**: 2-space indent, single quotes, trailing commas, 100 char width
- **`prisma/schema.prisma`**: Database models (PostgreSQL production, SQLite dev)

### Frontend (`packages/frontend/`)
- **`vite.config.ts`**: Vite 6 with React plugin, Tailwind CSS v4 plugin, `@/` alias, API proxy
- **`tsconfig.json`**: TypeScript (ESNext, strict mode, `@/` path alias)
- **`eslint.config.mjs`**: ESLint v9 with React hooks rules
- **`nginx.conf`**: Production nginx (SPA fallback, `/api` + `/api-docs` + `/health` proxy to backend)
- **`vercel.json`**: Vercel rewrites for SPA routing and API proxy

### Docker
- **`docker-compose.yml`**: Development (PostgreSQL, Redis, Adminer, hot reload, exposed ports)
- **`docker-compose.prod.yml`**: Production (nginx frontend on port 80, resource limits, healthchecks)
- **`packages/backend/Dockerfile`**: Multi-stage (development target with hot reload, production target)
- **`packages/frontend/Dockerfile`**: Multi-stage (node build stage, nginx production stage)

## Quick Reference: What Goes Where?

| I want to... | It should go in... |
|--------------|-------------------|
| Add a business rule | `packages/backend/src/domain/entities/` |
| Create a new value object | `packages/backend/src/domain/value-objects/` |
| Define an external dependency | `packages/backend/src/domain/ports/` |
| Implement a use case | `packages/backend/src/application/commands/` or `queries/` |
| Add a REST endpoint | `packages/backend/src/adapters/inbound/http/controllers/` |
| Add request validation | `packages/backend/src/adapters/inbound/http/validation/` |
| Add a DTO | `packages/backend/src/adapters/inbound/http/dtos/` |
| Implement data persistence | `packages/backend/src/adapters/outbound/persistence/` |
| Add third-party integration | `packages/backend/src/adapters/outbound/` |
| Configure the app | `packages/backend/src/infrastructure/config/` |
| Wire dependencies | `packages/backend/src/infrastructure/di/` |
| Add a frontend page | `packages/frontend/src/pages/` |
| Add a reusable component | `packages/frontend/src/components/` |
| Add an API integration | `packages/frontend/src/api/` |
| Add a React hook | `packages/frontend/src/hooks/` |
| Add shared TypeScript types | `packages/frontend/src/types/` |

## Common Patterns

### 1. Creating a New Backend Feature (Vertical Slice)

For a new feature (e.g., "Equipment Maintenance Scheduling"):

1. **Domain**: `packages/backend/src/domain/entities/MaintenanceSchedule.ts`
2. **Ports**: `packages/backend/src/domain/ports/MaintenanceScheduleRepository.ts`
3. **Command**: `packages/backend/src/application/commands/maintenance/ScheduleMaintenanceCommand.ts`
4. **Adapter**: `packages/backend/src/adapters/outbound/persistence/PrismaMaintenanceScheduleRepository.ts`
5. **DTO**: `packages/backend/src/adapters/inbound/http/dtos/MaintenanceDTOs.ts`
6. **Validation**: Add schema in `packages/backend/src/adapters/inbound/http/validation/schemas.ts`
7. **Controller**: `packages/backend/src/adapters/inbound/http/controllers/MaintenanceController.ts`
8. **DI**: Register in `packages/backend/src/infrastructure/di/Container.ts`

### 2. Adding a Frontend Page for an Existing API

1. **Types**: Add interfaces in `packages/frontend/src/types/api.ts`
2. **API**: Create `packages/frontend/src/api/maintenance.ts`
3. **Components**: Create in `packages/frontend/src/components/maintenance/`
4. **Page**: Create `packages/frontend/src/pages/MaintenancePage.tsx`
5. **Route**: Add route in `packages/frontend/src/router.tsx`
6. **Nav**: Add link in `packages/frontend/src/components/Sidebar.tsx`

### 3. Swapping Implementations

```typescript
// In packages/backend/src/infrastructure/di/Container.ts

// Testing:
const paymentService = new MockPaymentService();

// Production:
const paymentService = new StripePaymentService(config.stripeApiKey);

// Use case doesn't change - same interface, different implementation
```

## Environment Files

Create these files (not in git):

- **`packages/backend/.env`**: Local development
- **`packages/backend/.env.test`**: Test environment
- **`.env.production`**: Production docker-compose

Example `packages/backend/.env`:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://equipmentrental:dev_password@localhost:5432/equipmentrental
PAYMENT_PROVIDER=mock
NOTIFICATION_PROVIDER=console
LOG_LEVEL=debug
```

## Resources

- Main documentation: [README.md](README.md)
- Architecture details: [ARCHITECTURE.md](ARCHITECTURE.md)
- Implementation steps: [NEXT_STEPS.md](NEXT_STEPS.md)
