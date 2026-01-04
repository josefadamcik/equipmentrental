# Project Structure Reference

## Directory Layout

```
equipment-rental-system/
├── src/
│   ├── domain/                           # 🎯 Core Business Logic (Zero Dependencies)
│   │   ├── entities/                     # Business objects with identity
│   │   │   ├── Equipment.ts              # Rental items (cameras, tools, etc.)
│   │   │   ├── Rental.ts                 # Central aggregate for rentals
│   │   │   ├── Member.ts                 # Customers with membership tiers
│   │   │   ├── Reservation.ts            # Future booking system
│   │   │   └── DamageAssessment.ts       # Equipment condition evaluation
│   │   │
│   │   ├── value-objects/                # Immutable objects defined by values
│   │   │   ├── Money.ts                  # Monetary amounts with validation
│   │   │   ├── DateRange.ts              # Time periods with overlap detection
│   │   │   └── identifiers.ts            # Type-safe IDs (EquipmentId, RentalId, etc.)
│   │   │
│   │   ├── ports/                        # 🔌 Interface definitions (contracts)
│   │   │   ├── EquipmentRepository.ts    # Equipment data access contract
│   │   │   ├── MemberRepository.ts       # Member data access contract
│   │   │   ├── RentalRepository.ts       # Rental data access contract
│   │   │   ├── PaymentService.ts         # Payment processing contract
│   │   │   ├── NotificationService.ts    # Notification delivery contract
│   │   │   └── EventPublisher.ts         # Domain event publishing contract
│   │   │
│   │   ├── events/                       # Domain events (business occurrences)
│   │   │   ├── DomainEvent.ts            # Base event interface
│   │   │   ├── RentalEvents.ts           # RentalCreated, RentalReturned, etc.
│   │   │   ├── ReservationEvents.ts      # ReservationCreated, ReservationCancelled
│   │   │   └── EquipmentEvents.ts        # EquipmentDamaged, MaintenanceScheduled
│   │   │
│   │   ├── types/                        # Domain enums and type definitions
│   │   │   ├── RentalStatus.ts           # Active, Overdue, Returned, etc.
│   │   │   ├── EquipmentCondition.ts     # New, Good, Fair, Damaged
│   │   │   └── MembershipTier.ts         # Basic, Premium, Corporate
│   │   │
│   │   └── exceptions/                   # Domain-specific exceptions
│   │       ├── DomainException.ts        # Base exception class
│   │       ├── RentalExceptions.ts       # RentalNotAllowedError, etc.
│   │       ├── EquipmentExceptions.ts    # EquipmentNotAvailableError, etc.
│   │       └── MemberExceptions.ts       # MemberNotFoundError, etc.
│   │
│   ├── application/                      # 🎬 Use Cases and Orchestration
│   │   ├── commands/                     # Write operations (state changes)
│   │   │   ├── rental/
│   │   │   │   ├── CreateRentalCommand.ts
│   │   │   │   ├── ReturnRentalCommand.ts
│   │   │   │   └── ExtendRentalCommand.ts
│   │   │   ├── reservation/
│   │   │   │   ├── CreateReservationCommand.ts
│   │   │   │   └── CancelReservationCommand.ts
│   │   │   └── equipment/
│   │   │       └── AssessDamageCommand.ts
│   │   │
│   │   ├── queries/                      # Read operations (data retrieval)
│   │   │   ├── GetAvailableEquipmentQuery.ts
│   │   │   ├── GetRentalQuery.ts
│   │   │   ├── GetMemberRentalsQuery.ts
│   │   │   └── GetOverdueRentalsQuery.ts
│   │   │
│   │   └── services/                     # Application services
│   │       ├── RentalService.ts          # Coordinates rental operations
│   │       └── ReservationService.ts     # Manages reservation lifecycle
│   │
│   ├── adapters/                         # 🔄 External Interface Implementations
│   │   ├── inbound/                      # Entry points INTO the application
│   │   │   ├── http/                     # REST API (Express/Fastify/NestJS)
│   │   │   │   ├── controllers/
│   │   │   │   │   ├── RentalController.ts
│   │   │   │   │   ├── EquipmentController.ts
│   │   │   │   │   ├── MemberController.ts
│   │   │   │   │   └── ReservationController.ts
│   │   │   │   ├── middleware/
│   │   │   │   │   ├── errorHandler.ts
│   │   │   │   │   └── requestLogger.ts
│   │   │   │   └── server.ts             # HTTP server setup
│   │   │   │
│   │   │   └── cli/                      # Command-line interface
│   │   │       └── RentalCLI.ts          # Admin commands
│   │   │
│   │   └── outbound/                     # Connections TO external systems
│   │       ├── persistence/              # Database implementations
│   │       │   ├── InMemoryEquipmentRepository.ts    # For testing
│   │       │   ├── InMemoryMemberRepository.ts       # For testing
│   │       │   ├── InMemoryRentalRepository.ts       # For testing
│   │       │   ├── PrismaEquipmentRepository.ts      # Real DB
│   │       │   ├── PrismaMemberRepository.ts         # Real DB
│   │       │   └── PrismaRentalRepository.ts         # Real DB
│   │       │
│   │       ├── payment/                  # Payment gateway implementations
│   │       │   ├── MockPaymentService.ts             # For testing
│   │       │   └── StripePaymentService.ts           # Real payment
│   │       │
│   │       └── notification/             # Notification implementations
│   │           ├── ConsoleNotificationService.ts     # For testing
│   │           └── EmailNotificationService.ts       # Real notifications
│   │
│   ├── infrastructure/                   # ⚙️  Cross-Cutting Concerns
│   │   ├── config/                       # Configuration management
│   │   │   ├── Config.ts                 # Main config loader
│   │   │   ├── DatabaseConfig.ts         # DB connection settings
│   │   │   └── ServerConfig.ts           # Server settings
│   │   │
│   │   ├── logging/                      # Logging setup
│   │   │   ├── Logger.ts                 # Logger implementation
│   │   │   └── RequestLogger.ts          # HTTP request logging
│   │   │
│   │   └── di/                           # Dependency Injection
│   │       ├── Container.ts              # DI container
│   │       └── types.ts                  # DI token definitions
│   │
│   └── index.ts                          # 🚀 Application entry point
│
├── prisma/                               # Database schema (if using Prisma)
│   └── schema.prisma                     # Database models
│
├── tests/                                # End-to-end tests (optional)
│   └── e2e/
│       └── rental.e2e.test.ts
│
├── dist/                                 # Compiled JavaScript (gitignored)
├── node_modules/                         # Dependencies (gitignored)
├── coverage/                             # Test coverage reports (gitignored)
│
├── .gitignore                            # Git ignore rules
├── .prettierrc                           # Prettier configuration
├── .prettierignore                       # Prettier ignore rules
├── eslint.config.mjs                     # ESLint configuration (flat config)
├── jest.config.js                        # Jest testing configuration
├── tsconfig.json                         # TypeScript configuration
├── package.json                          # Project dependencies and scripts
│
├── README.md                             # 📖 Project overview and setup
├── ARCHITECTURE.md                       # 🏛️  Architecture deep dive
├── NEXT_STEPS.md                         # 📋 Implementation roadmap
└── PROJECT_STRUCTURE.md                  # 📁 This file
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
- **Events**: `PascalCaseEvent.ts` (e.g., `RentalCreated.ts`)
- **Exceptions**: `PascalCaseException.ts` (e.g., `RentalNotAllowedError.ts`)

### Application Layer
- **Commands**: `VerbNounCommand.ts` (e.g., `CreateRentalCommand.ts`)
- **Queries**: `GetNounQuery.ts` (e.g., `GetAvailableEquipmentQuery.ts`)
- **Services**: `NounService.ts` (e.g., `RentalService.ts`)

### Adapters Layer
- **Controllers**: `NounController.ts` (e.g., `RentalController.ts`)
- **Repositories**: `TechnologyNounRepository.ts` (e.g., `PrismaRentalRepository.ts`)
- **Services**: `TechnologyNounService.ts` (e.g., `StripePaymentService.ts`)

### Tests
- **Unit tests**: `FileName.test.ts` (next to source file or in `__tests__`)
- **Integration tests**: `FileName.integration.test.ts`
- **E2E tests**: `feature-name.e2e.test.ts`

## Import Path Aliases

Configured in `tsconfig.json`:

```typescript
// Instead of relative imports:
import { Money } from '../../../domain/value-objects/Money';

// Use path aliases:
import { Money } from '@domain/value-objects/Money';
import { CreateRentalCommand } from '@application/commands/rental/CreateRentalCommand';
import { RentalController } from '@adapters/inbound/http/controllers/RentalController';
import { Container } from '@infrastructure/di/Container';
```

## Test File Organization

```
src/
├── domain/
│   ├── entities/
│   │   ├── Rental.ts
│   │   └── __tests__/
│   │       └── Rental.test.ts           # Unit test
│   └── value-objects/
│       ├── Money.ts
│       └── __tests__/
│           └── Money.test.ts            # Unit test
│
├── application/
│   └── commands/
│       ├── CreateRentalCommand.ts
│       └── __tests__/
│           └── CreateRentalCommand.test.ts  # Integration test
│
└── adapters/
    └── outbound/
        └── persistence/
            ├── PrismaRentalRepository.ts
            └── __tests__/
                └── PrismaRentalRepository.test.ts  # Adapter test
```

## Configuration Files

### TypeScript Configuration
- **`tsconfig.json`**: Main TypeScript compiler configuration
  - Target: ES2022
  - Module: CommonJS
  - Strict mode enabled
  - Path aliases configured
  - Output to `dist/`

### Linting & Formatting
- **`eslint.config.mjs`**: ESLint v9 flat config
  - TypeScript ESLint rules
  - Prettier integration
  - Naming conventions enforced
- **`.prettierrc`**: Code formatting rules
  - 2 space indentation
  - Single quotes
  - Trailing commas
  - 100 character line width

### Testing
- **`jest.config.js`**: Jest testing framework
  - ts-jest preset for TypeScript
  - Path aliases mapped
  - Coverage collection configured
  - Test patterns defined

### Package Management
- **`package.json`**: Dependencies and scripts
  - TypeScript, ESLint, Prettier, Jest
  - Build, test, lint, format scripts
  - Development and production dependencies

## Quick Reference: What Goes Where?

| I want to... | It should go in... | Example |
|--------------|-------------------|---------|
| Add a business rule | `src/domain/entities/` | Late fee calculation |
| Create a new entity | `src/domain/entities/` | `Reservation.ts` |
| Add a new value object | `src/domain/value-objects/` | `EmailAddress.ts` |
| Define an external dependency | `src/domain/ports/` | `EmailService.ts` interface |
| Implement a use case | `src/application/commands/` or `queries/` | `CreateRentalCommand.ts` |
| Add a REST endpoint | `src/adapters/inbound/http/controllers/` | `RentalController.ts` |
| Implement data persistence | `src/adapters/outbound/persistence/` | `PrismaRentalRepository.ts` |
| Add third-party integration | `src/adapters/outbound/` | `StripePaymentService.ts` |
| Configure the app | `src/infrastructure/config/` | `DatabaseConfig.ts` |
| Wire dependencies | `src/infrastructure/di/` | `Container.ts` |

## Common Patterns

### 1. Creating a New Feature (Vertical Slice)

For a new feature (e.g., "Equipment Maintenance Scheduling"):

1. **Domain**: `src/domain/entities/MaintenanceSchedule.ts`
2. **Ports**: `src/domain/ports/MaintenanceScheduleRepository.ts`
3. **Command**: `src/application/commands/maintenance/ScheduleMaintenanceCommand.ts`
4. **Adapter**: `src/adapters/outbound/persistence/PrismaMaintenanceScheduleRepository.ts`
5. **Controller**: `src/adapters/inbound/http/controllers/MaintenanceController.ts`
6. **DI**: Register in `src/infrastructure/di/Container.ts`

### 2. Swapping Implementations

To switch from mock to real payment service:

```typescript
// In src/infrastructure/di/Container.ts

// Before (testing):
const paymentService = new MockPaymentService();

// After (production):
const paymentService = new StripePaymentService(config.stripeApiKey);

// Use case doesn't change!
const handler = new CreateRentalCommandHandler(
  equipmentRepo,
  memberRepo,
  rentalRepo,
  paymentService,  // ← Same interface, different implementation
  eventPublisher
);
```

### 3. Adding Tests

```typescript
// Domain test (pure logic, no mocks)
describe('Rental', () => {
  it('calculates late fee correctly', () => {
    const rental = createTestRental();
    const fee = rental.calculateLateFee(threeDaysLate);
    expect(fee.amount).toBe(40);
  });
});

// Application test (in-memory adapters)
describe('CreateRentalCommandHandler', () => {
  let equipmentRepo: InMemoryEquipmentRepository;
  let handler: CreateRentalCommandHandler;

  beforeEach(() => {
    equipmentRepo = new InMemoryEquipmentRepository();
    handler = new CreateRentalCommandHandler(equipmentRepo, ...);
  });

  it('creates rental successfully', async () => {
    const rentalId = await handler.execute(command);
    expect(rentalId).toBeDefined();
  });
});
```

## Environment Files

Create these files (not in git):

- **`.env`**: Local development environment variables
- **`.env.test`**: Test environment variables
- **`.env.production`**: Production environment variables

Example `.env`:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/equipmentrental
STRIPE_API_KEY=sk_test_...
LOG_LEVEL=debug
```

## Build Output

After running `npm run build`:

```
dist/
├── domain/
│   ├── entities/
│   │   ├── Rental.js
│   │   ├── Rental.d.ts
│   │   └── Rental.js.map
│   └── ...
├── application/
├── adapters/
├── infrastructure/
└── index.js                 # Entry point
```

## Development Workflow

1. **Start**: Create domain entities and value objects
2. **Define**: Create ports (interfaces)
3. **Test**: Write unit tests for domain logic
4. **Implement**: Create use cases in application layer
5. **Adapt**: Build adapters for infrastructure
6. **Wire**: Configure dependency injection
7. **Verify**: Run end-to-end tests
8. **Deploy**: Build and run in production

## Resources

- Main documentation: [README.md](README.md)
- Architecture details: [ARCHITECTURE.md](ARCHITECTURE.md)
- Implementation steps: [NEXT_STEPS.md](NEXT_STEPS.md)
