# Equipment Rental System

A demonstration of **Hexagonal Architecture** (Ports and Adapters) implementation in Node.js and TypeScript.

## Overview

This project implements a backend system for managing equipment rentals, demonstrating clean separation of concerns through hexagonal architecture principles. The domain logic is completely isolated from infrastructure concerns, making the system highly testable, maintainable, and adaptable.

## Core Domain Concepts

### Entities
- **Equipment**: Items available for rent (cameras, tools, sports gear) with availability tracking, condition monitoring, and maintenance schedules
- **Rental**: The central aggregate managing the rental lifecycle (reserved → active → overdue → returned → completed)
- **Member**: Customers with membership tiers (basic, premium, corporate) and associated privileges
- **Reservation**: Future rental bookings with cancellation policies

### Key Business Rules
- **Availability Management**: Equipment blocked during rental periods, with automatic availability updates on cancellations
- **Late Fee Calculation**: Tiered rates based on membership level, capped at equipment replacement value
- **Rental Extensions**: Members can extend rentals if no conflicting reservations exist
- **Membership Restrictions**: Tier-based limits on simultaneous rentals, equipment access, and reservation advance time
- **Damage Assessment**: Condition evaluation on return with deposit deductions for damage
- **Maintenance Windows**: Equipment offline periods that block availability

## Architecture

### Hexagonal Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Inbound Adapters                         │
│            (HTTP Controllers, CLI, Events)                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                   Application Layer                         │
│         (Use Cases, Commands, Queries, Services)           │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                     Domain Layer                            │
│   (Entities, Value Objects, Domain Events, Business Rules) │
│                    ◄───Ports───►                            │
└─────────────────────────────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                   Outbound Adapters                         │
│        (Database, Payment Gateway, Notifications)          │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
src/
├── domain/                    # Core business logic (no dependencies)
│   ├── entities/             # Domain entities (Equipment, Rental, Member)
│   ├── value-objects/        # Immutable value objects (Money, DateRange)
│   ├── ports/                # Interface definitions (repository, service contracts)
│   ├── events/               # Domain events
│   ├── types/                # Domain types and enums
│   └── exceptions/           # Domain-specific exceptions
│
├── application/              # Application use cases
│   ├── commands/            # Write operations (CreateRental, ReturnEquipment)
│   ├── queries/             # Read operations (GetAvailableEquipment)
│   └── services/            # Application services orchestrating use cases
│
├── adapters/                # External interface implementations
│   ├── inbound/            # Entry points into the application
│   │   ├── http/           # REST API controllers
│   │   └── cli/            # Command-line interface
│   └── outbound/           # Infrastructure implementations
│       ├── persistence/    # Database repositories (Prisma, TypeORM)
│       ├── payment/        # Payment service adapters (Stripe, mock)
│       └── notification/   # Notification adapters (Email, SMS)
│
└── infrastructure/          # Cross-cutting concerns
    ├── config/             # Configuration management
    ├── logging/            # Logging setup
    └── di/                 # Dependency injection container
```

## Key Principles

### 1. Dependency Rule
- **Domain Layer**: No dependencies on other layers (pure TypeScript)
- **Application Layer**: Depends only on domain
- **Adapters**: Depend on application and domain
- **Infrastructure**: Orchestrates everything

### 2. Port Definitions
Ports are interfaces defined in the domain that adapters must implement:

```typescript
// Domain defines the contract
export interface EquipmentRepository {
  findById(id: EquipmentId): Promise<Equipment | null>;
  save(equipment: Equipment): Promise<void>;
}

// Adapter implements the contract
export class PrismaEquipmentRepository implements EquipmentRepository {
  // Implementation details
}
```

### 3. Testability
- **Domain logic**: Pure unit tests, no mocks needed
- **Application layer**: Test with in-memory repositories
- **Adapters**: Test against real infrastructure or mocks

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
# Run in development mode with hot reload
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check
```

### Build

```bash
# Build for production
npm run build

# Run production build
npm start

# Clean build artifacts
npm run clean
```

## Development Workflow

### Adding a New Feature

1. **Define domain entities and value objects** in `src/domain/`
2. **Create domain events** if needed in `src/domain/events/`
3. **Define ports** (interfaces) in `src/domain/ports/`
4. **Implement use cases** in `src/application/commands/` or `src/application/queries/`
5. **Create adapters** to implement ports in `src/adapters/outbound/`
6. **Add inbound adapters** (controllers) in `src/adapters/inbound/`
7. **Wire dependencies** in `src/infrastructure/di/`

### Testing Strategy

- **Domain Layer**: Unit tests focusing on business rules
- **Application Layer**: Integration tests with in-memory adapters
- **Adapters**: Adapter tests against real implementations or comprehensive mocks
- **End-to-End**: Full system tests through HTTP endpoints

## Technology Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Testing**: Jest
- **Code Quality**: ESLint, Prettier
- **Build**: TypeScript Compiler

## Future Enhancements

- Database integration (Prisma/TypeORM)
- REST API implementation (Express/Fastify/NestJS)
- Authentication & Authorization
- Payment gateway integration (Stripe)
- Email notifications
- Reservation queue system
- Maintenance scheduling
- Reporting & analytics
- GraphQL API adapter

## Resources

### Hexagonal Architecture
- [Alistair Cockburn - Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Netflix - Ready for changes with Hexagonal Architecture](https://netflixtechblog.com/ready-for-changes-with-hexagonal-architecture-b315ec967749)

### Domain-Driven Design
- [DDD Reference by Eric Evans](https://www.domainlanguage.com/ddd/reference/)
- [Martin Fowler - Domain-Driven Design](https://martinfowler.com/tags/domain%20driven%20design.html)

## License

MIT
