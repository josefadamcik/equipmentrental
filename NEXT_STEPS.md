# Next Steps

This document outlines the recommended implementation steps for building the Equipment Rental System using hexagonal architecture.

## Phase 1: Core Domain Layer

### 1.1 Value Objects ✅ COMPLETED
Create immutable value objects that encapsulate validation and behavior:

- [x] `Money` - Monetary amounts with arithmetic operations
- [x] `DateRange` - Period with overlap detection and validation
- [x] `EquipmentId`, `RentalId`, `MemberId`, `ReservationId`, `DamageAssessmentId` - Strongly-typed identifiers
- [x] `EquipmentCondition` - Const object (modern TS pattern) for condition states
- [x] `RentalStatus` - Const object for rental lifecycle states
- [x] `MembershipTier` - Const object for tier levels

**Files created**:
- ✅ `src/domain/value-objects/Money.ts`
- ✅ `src/domain/value-objects/DateRange.ts`
- ✅ `src/domain/value-objects/identifiers.ts`
- ✅ `src/domain/types/EquipmentCondition.ts`
- ✅ `src/domain/types/RentalStatus.ts`
- ✅ `src/domain/types/MembershipTier.ts`

**Tests created**:
- ✅ `src/domain/value-objects/__tests__/Money.test.ts`
- ✅ `src/domain/value-objects/__tests__/DateRange.test.ts`
- ✅ `src/domain/value-objects/__tests__/identifiers.test.ts`
- ✅ `src/domain/types/__tests__/EquipmentCondition.test.ts`
- ✅ `src/domain/types/__tests__/RentalStatus.test.ts`
- ✅ `src/domain/types/__tests__/MembershipTier.test.ts`

**Test Coverage**: 112 tests passing

### 1.2 Domain Entities ✅ COMPLETED
Build core business entities with rich behavior:

- [x] `Equipment` - Rental items with availability tracking
- [x] `Member` - Customers with tier-based rules
- [x] `Rental` - Central aggregate managing rental lifecycle
- [x] `Reservation` - Future booking system
- [x] `DamageAssessment` - Condition evaluation on return

**Files created**:
- ✅ `src/domain/entities/Equipment.ts`
- ✅ `src/domain/entities/Member.ts`
- ✅ `src/domain/entities/Rental.ts`
- ✅ `src/domain/entities/Reservation.ts`
- ✅ `src/domain/entities/DamageAssessment.ts`

**Tests created**:
- ✅ `src/domain/entities/__tests__/Equipment.test.ts`
- ✅ `src/domain/entities/__tests__/Member.test.ts`
- ✅ `src/domain/entities/__tests__/Rental.test.ts`

**Test Coverage**: 186 tests passing (75 new entity tests + 112 previous tests)

### 1.3 Domain Events ✅ COMPLETED
Define events that represent business occurrences:

- [x] `RentalCreated`
- [x] `RentalReturned`
- [x] `RentalOverdue`
- [x] `ReservationCreated`
- [x] `ReservationCancelled`
- [x] `EquipmentDamaged`

**Files to create**:
- `src/domain/events/RentalEvents.ts`
- `src/domain/events/ReservationEvents.ts`
- `src/domain/events/EquipmentEvents.ts`
- `src/domain/events/DomainEvent.ts` (base interface)

### 1.4 Domain Exceptions ✅ COMPLETED
Create specific exception types for business rule violations:

- [x] `RentalNotAllowedError`
- [x] `EquipmentNotAvailableError`
- [x] `InvalidStateTransitionError`
- [x] `EquipmentNotFoundError`
- [x] `MemberNotFoundError`
- [x] Additional exceptions: `RentalAlreadyReturnedError`, `InvalidRentalExtensionError`, `OverdueRentalError`
- [x] Additional exceptions: `EquipmentAlreadyRentedError`, `EquipmentInMaintenanceError`, `EquipmentConditionUnacceptableError`, `EquipmentRetiredError`
- [x] Additional exceptions: `MemberSuspendedError`, `RentalLimitExceededError`, `MemberHasOverdueRentalsError`, `MemberInactiveError`, `InsufficientMemberTierError`

**Files created**:
- ✅ `src/domain/exceptions/RentalExceptions.ts`
- ✅ `src/domain/exceptions/EquipmentExceptions.ts`
- ✅ `src/domain/exceptions/MemberExceptions.ts`
- ✅ `src/domain/exceptions/DomainException.ts` (base class)

**Tests created**:
- ✅ `src/domain/exceptions/__tests__/DomainException.test.ts`
- ✅ `src/domain/exceptions/__tests__/RentalExceptions.test.ts`
- ✅ `src/domain/exceptions/__tests__/EquipmentExceptions.test.ts`
- ✅ `src/domain/exceptions/__tests__/MemberExceptions.test.ts`

**Test Coverage**: 318 tests passing (82 new exception tests)

### 1.5 Ports (Interfaces) ✅ COMPLETED
Define contracts for external dependencies:

- [x] `EquipmentRepository`
- [x] `MemberRepository`
- [x] `RentalRepository`
- [x] `ReservationRepository`
- [x] `PaymentService`
- [x] `NotificationService`
- [x] `EventPublisher`

**Files created**:
- ✅ `src/domain/ports/EquipmentRepository.ts`
- ✅ `src/domain/ports/MemberRepository.ts`
- ✅ `src/domain/ports/RentalRepository.ts`
- ✅ `src/domain/ports/ReservationRepository.ts`
- ✅ `src/domain/ports/PaymentService.ts`
- ✅ `src/domain/ports/NotificationService.ts`
- ✅ `src/domain/ports/EventPublisher.ts`

**Tests created**:
- ✅ `src/domain/ports/__tests__/EquipmentRepository.test.ts`
- ✅ `src/domain/ports/__tests__/MemberRepository.test.ts`
- ✅ `src/domain/ports/__tests__/RentalRepository.test.ts`
- ✅ `src/domain/ports/__tests__/ReservationRepository.test.ts`
- ✅ `src/domain/ports/__tests__/PaymentService.test.ts`
- ✅ `src/domain/ports/__tests__/NotificationService.test.ts`
- ✅ `src/domain/ports/__tests__/EventPublisher.test.ts`

**Test Coverage**: 464 tests passing (146 new port tests + 318 previous tests)

## Phase 2: Application Layer

### 2.1 Command Handlers (Write Operations) ✅ COMPLETED
Implement use cases that change state:

- [x] `CreateRentalCommandHandler` - Start a new rental
- [x] `ReturnRentalCommandHandler` - Return equipment
- [x] `ExtendRentalCommandHandler` - Extend rental period
- [x] `CreateReservationCommandHandler` - Make a reservation
- [x] `CancelReservationCommandHandler` - Cancel a reservation
- [x] `AssessDamageCommandHandler` - Evaluate equipment condition

**Files created**:
- ✅ `src/application/commands/rental/CreateRentalCommand.ts`
- ✅ `src/application/commands/rental/ReturnRentalCommand.ts`
- ✅ `src/application/commands/rental/ExtendRentalCommand.ts`
- ✅ `src/application/commands/reservation/CreateReservationCommand.ts`
- ✅ `src/application/commands/reservation/CancelReservationCommand.ts`
- ✅ `src/application/commands/damage/AssessDamageCommand.ts`

**Tests created**:
- ✅ `src/application/commands/__tests__/CreateRentalCommandHandler.test.ts`
- ✅ `src/application/commands/__tests__/ReturnRentalCommandHandler.test.ts`
- ✅ `src/application/commands/__tests__/CommandHandlers.test.ts`

**Test Coverage**: 483 tests passing (19 new command handler tests + 464 previous tests)

### 2.2 Query Handlers (Read Operations) ✅ COMPLETED
Implement use cases that fetch data:

- [x] `GetAvailableEquipmentQueryHandler`
- [x] `GetRentalQueryHandler`
- [x] `GetMemberRentalsQueryHandler`
- [x] `GetOverdueRentalsQueryHandler`
- [x] `GetEquipmentMaintenanceScheduleQueryHandler`

**Files created**:
- ✅ `src/application/queries/GetAvailableEquipmentQuery.ts`
- ✅ `src/application/queries/GetRentalQuery.ts`
- ✅ `src/application/queries/GetMemberRentalsQuery.ts`
- ✅ `src/application/queries/GetOverdueRentalsQuery.ts`
- ✅ `src/application/queries/GetEquipmentMaintenanceScheduleQuery.ts`

**Tests created**:
- ✅ `src/application/queries/__tests__/QueryHandlers.test.ts`

**Test Coverage**: 503 tests passing (20 new query handler tests + 483 previous tests)

### 2.3 Application Services ✅ COMPLETED
Orchestrate complex workflows:

- [x] `RentalService` - Coordinates rental operations
- [x] `ReservationService` - Manages reservation lifecycle

**Files created**:
- ✅ `src/application/services/RentalService.ts`
- ✅ `src/application/services/ReservationService.ts`

**Tests created**:
- ✅ `src/application/services/__tests__/RentalService.test.ts`
- ✅ `src/application/services/__tests__/ReservationService.test.ts`

**Test Coverage**: 531 tests passing (28 new service tests + 503 previous tests)

## Phase 3: Adapters Layer

### 3.1 In-Memory Adapters (for testing)
Create simple implementations for testing:

- [ ] `InMemoryEquipmentRepository`
- [ ] `InMemoryMemberRepository`
- [ ] `InMemoryRentalRepository`
- [ ] `MockPaymentService`
- [ ] `InMemoryEventPublisher`

**Files to create**:
- `src/adapters/outbound/persistence/InMemoryEquipmentRepository.ts`
- `src/adapters/outbound/persistence/InMemoryMemberRepository.ts`
- `src/adapters/outbound/persistence/InMemoryRentalRepository.ts`
- `src/adapters/outbound/payment/MockPaymentService.ts`

### 3.2 Database Adapters
Choose and implement a real database adapter:

**Option A: Prisma**
- [ ] Install Prisma: `npm install prisma @prisma/client`
- [ ] Initialize Prisma: `npx prisma init`
- [ ] Define schema in `prisma/schema.prisma`
- [ ] Create migrations
- [ ] Implement repository adapters

**Option B: TypeORM**
- [ ] Install TypeORM: `npm install typeorm reflect-metadata`
- [ ] Define entity schemas
- [ ] Create migrations
- [ ] Implement repository adapters

**Files to create** (Prisma example):
- `prisma/schema.prisma`
- `src/adapters/outbound/persistence/PrismaEquipmentRepository.ts`
- `src/adapters/outbound/persistence/PrismaMemberRepository.ts`
- `src/adapters/outbound/persistence/PrismaRentalRepository.ts`

### 3.3 Payment Service Adapters
Implement payment gateway integration:

- [ ] `StripePaymentService` - Real Stripe integration
- [ ] Or keep `MockPaymentService` for demo purposes

**Files to create**:
- `src/adapters/outbound/payment/StripePaymentService.ts`

### 3.4 Notification Adapters
Implement notification delivery:

- [ ] `EmailNotificationService` - Send emails
- [ ] `ConsoleNotificationService` - Log to console (for testing)

**Files to create**:
- `src/adapters/outbound/notification/EmailNotificationService.ts`
- `src/adapters/outbound/notification/ConsoleNotificationService.ts`

### 3.5 HTTP Controllers (REST API)
Choose a web framework and implement controllers:

**Option A: Express**
```bash
npm install express @types/express
```

**Option B: Fastify**
```bash
npm install fastify
```

**Option C: NestJS** (includes DI container)
```bash
npm install @nestjs/core @nestjs/common @nestjs/platform-express
```

**Controllers to create**:
- [ ] `RentalController` - CRUD operations for rentals
- [ ] `EquipmentController` - Equipment management
- [ ] `MemberController` - Member operations
- [ ] `ReservationController` - Reservation handling

**Files to create** (Express example):
- `src/adapters/inbound/http/server.ts`
- `src/adapters/inbound/http/controllers/RentalController.ts`
- `src/adapters/inbound/http/controllers/EquipmentController.ts`
- `src/adapters/inbound/http/controllers/MemberController.ts`
- `src/adapters/inbound/http/middleware/errorHandler.ts`

## Phase 4: Infrastructure Layer

### 4.1 Dependency Injection Container
Wire all components together:

- [ ] Create container that registers all dependencies
- [ ] Map interfaces to implementations
- [ ] Provide factory methods for use cases

**Files to create**:
- `src/infrastructure/di/Container.ts`
- `src/infrastructure/di/types.ts` (DI tokens)

**Alternative**: Use a DI library like `tsyringe` or `inversify`

### 4.2 Configuration Management
Handle environment-specific settings:

- [ ] Database connection strings
- [ ] Payment API keys
- [ ] Server port and host
- [ ] Logging levels

**Files to create**:
- `src/infrastructure/config/Config.ts`
- `src/infrastructure/config/DatabaseConfig.ts`
- `src/infrastructure/config/ServerConfig.ts`
- `.env.example`

### 4.3 Logging
Set up structured logging:

- [ ] Choose logger (Winston, Pino, or built-in console)
- [ ] Configure log levels
- [ ] Add request logging middleware

**Files to create**:
- `src/infrastructure/logging/Logger.ts`
- `src/infrastructure/logging/RequestLogger.ts`

### 4.4 Application Bootstrap
Initialize and start the application:

- [ ] Load configuration
- [ ] Initialize database connections
- [ ] Register dependencies in DI container
- [ ] Start HTTP server
- [ ] Set up graceful shutdown

**Update**:
- `src/index.ts` - Main entry point

## Phase 5: Testing

### 5.1 Unit Tests
Test domain logic in isolation:

- [ ] Test all value objects
- [ ] Test all entities
- [ ] Test business rule enforcement
- [ ] Test state transitions

### 5.2 Integration Tests
Test use cases with in-memory adapters:

- [ ] Test command handlers
- [ ] Test query handlers
- [ ] Test application services

### 5.3 End-to-End Tests
Test complete flows through HTTP endpoints:

- [ ] Test rental creation flow
- [ ] Test return flow with late fees
- [ ] Test reservation system
- [ ] Test error scenarios

**Install testing tools**:
```bash
npm install --save-dev supertest @types/supertest
```

## Phase 6: Documentation and Deployment

### 6.1 API Documentation
Document the REST API:

- [ ] Use Swagger/OpenAPI
- [ ] Document all endpoints
- [ ] Provide example requests/responses

**Install tools**:
```bash
npm install swagger-ui-express @types/swagger-ui-express
```

### 6.2 Docker Setup
Containerize the application:

- [ ] Create `Dockerfile`
- [ ] Create `docker-compose.yml` with database
- [ ] Set up development and production configurations

### 6.3 CI/CD Pipeline
Automate testing and deployment:

- [ ] Set up GitHub Actions or similar
- [ ] Run tests on push
- [ ] Run linting and type checking
- [ ] Build and deploy

## Recommended Implementation Order

1. **Start with Value Objects** - They have no dependencies
2. **Build Domain Entities** - Using the value objects
3. **Define Ports** - Establish contracts
4. **Create In-Memory Adapters** - For testing
5. **Implement Use Cases** - Test with in-memory adapters
6. **Add Real Adapters** - Database, HTTP, etc.
7. **Wire Everything Together** - DI container and bootstrap
8. **Add End-to-End Tests** - Verify complete flows

## Development Commands

```bash
# Development
npm run dev              # Run with hot reload

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Code Quality
npm run lint             # Check for linting errors
npm run lint:fix         # Auto-fix linting errors
npm run format           # Format code with Prettier
npm run typecheck        # Run TypeScript type checking

# Build
npm run build            # Compile TypeScript
npm start                # Run production build
npm run clean            # Remove build artifacts
```

## Tips

1. **Test-Driven Development**: Write tests first, especially for domain logic
2. **Small Commits**: Commit after each completed component
3. **Port First**: Define interfaces before implementations
4. **Domain Focus**: Keep business logic in the domain layer
5. **Vertical Slices**: Implement one feature end-to-end before moving to the next
6. **Documentation**: Update architecture docs as patterns emerge

## Questions to Consider

- Which database will you use? (PostgreSQL, MySQL, MongoDB)
- Which web framework? (Express, Fastify, NestJS)
- Will you integrate real payment gateway or use mocks?
- Do you need authentication/authorization?
- Will you implement a GraphQL API in addition to REST?
- Do you need event sourcing or CQRS patterns?
