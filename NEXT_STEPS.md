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

### 3.1 In-Memory Adapters (for testing) ✅ COMPLETED
Create simple implementations for testing:

- [x] `InMemoryEquipmentRepository`
- [x] `InMemoryMemberRepository`
- [x] `InMemoryRentalRepository`
- [x] `InMemoryReservationRepository`
- [x] `MockPaymentService`
- [x] `InMemoryEventPublisher`

**Files created**:
- ✅ `src/adapters/outbound/persistence/InMemoryEquipmentRepository.ts`
- ✅ `src/adapters/outbound/persistence/InMemoryMemberRepository.ts`
- ✅ `src/adapters/outbound/persistence/InMemoryRentalRepository.ts`
- ✅ `src/adapters/outbound/persistence/InMemoryReservationRepository.ts`
- ✅ `src/adapters/outbound/payment/MockPaymentService.ts`
- ✅ `src/adapters/outbound/events/InMemoryEventPublisher.ts`

**Tests created**:
- ✅ `src/adapters/outbound/persistence/__tests__/InMemoryEquipmentRepository.test.ts`
- ✅ `src/adapters/outbound/persistence/__tests__/InMemoryMemberRepository.test.ts`
- ✅ `src/adapters/outbound/persistence/__tests__/InMemoryRentalRepository.test.ts`
- ✅ `src/adapters/outbound/persistence/__tests__/InMemoryReservationRepository.test.ts`
- ✅ `src/adapters/outbound/payment/__tests__/MockPaymentService.test.ts`
- ✅ `src/adapters/outbound/events/__tests__/InMemoryEventPublisher.test.ts`

**Test Coverage**: 659 tests passing (98 new adapter tests + 561 previous tests)

### 3.2 Database Adapters ✅ COMPLETED
Implemented Prisma ORM for production database persistence:

- [x] Install Prisma: `npm install prisma @prisma/client`
- [x] Initialize Prisma: `npx prisma init --datasource-provider sqlite`
- [x] Define schema in `prisma/schema.prisma`
- [x] Create migrations
- [x] Implement repository adapters

**Files created**:
- ✅ `prisma/schema.prisma` - Complete database schema with Equipment, Member, Rental, Reservation, and DamageAssessment models
- ✅ `prisma.config.ts` - Prisma configuration
- ✅ `prisma/migrations/` - Database migrations for schema versioning
- ✅ `.env.example` - Environment configuration template
- ✅ `src/adapters/outbound/persistence/PrismaEquipmentRepository.ts`
- ✅ `src/adapters/outbound/persistence/PrismaMemberRepository.ts`
- ✅ `src/adapters/outbound/persistence/PrismaRentalRepository.ts`
- ✅ `src/adapters/outbound/persistence/PrismaReservationRepository.ts`

**Features implemented**:
- Full CRUD operations for all entities
- Complex queries (availability checks, conflict detection, overdue tracking)
- Proper domain-to-database mapping with value objects
- Database indexes on frequently queried fields
- Support for SQLite (dev) with easy migration to PostgreSQL/MySQL (production)

**Test Coverage**: 659 tests passing (all existing tests still green)

### 3.3 Payment Service Adapters ✅ COMPLETED
Implement payment gateway integration:

- [x] `StripePaymentService` - Real Stripe integration
- [x] Keep `MockPaymentService` for demo purposes (already exists)

**Files created**:
- ✅ `src/adapters/outbound/payment/StripePaymentService.ts`

**Tests created**:
- ✅ `src/adapters/outbound/payment/__tests__/StripePaymentService.test.ts`

**Test Coverage**: 749 tests passing (31 new Stripe payment service tests included in total)

**Features implemented**:
- Full Stripe PaymentIntents API integration
- Payment processing with automatic payment methods
- Authorization and capture workflow for reservations
- Refund processing with reason mapping
- Idempotency support for safe retries
- Payment method verification
- Processing fee calculation matching Stripe's pricing
- Comprehensive error handling for Stripe API errors

### 3.4 Notification Adapters ✅ COMPLETED
Implement notification delivery:

- [x] `EmailNotificationService` - Send emails
- [x] `ConsoleNotificationService` - Log to console (for testing)

**Files created**:
- ✅ `src/adapters/outbound/notification/EmailNotificationService.ts`
- ✅ `src/adapters/outbound/notification/ConsoleNotificationService.ts`

**Tests created**:
- ✅ `src/adapters/outbound/notification/__tests__/EmailNotificationService.test.ts`
- ✅ `src/adapters/outbound/notification/__tests__/ConsoleNotificationService.test.ts`

**Test Coverage**: 718 tests passing (35 new notification adapter tests + 683 previous tests)

### 3.5 HTTP Controllers (REST API) ✅ COMPLETED
Implemented REST API using Express framework:

- [x] `RentalController` - CRUD operations for rentals
- [x] `EquipmentController` - Equipment management
- [x] `MemberController` - Member operations
- [x] `ReservationController` - Reservation handling

**Files created**:
- ✅ `src/adapters/inbound/http/server.ts`
- ✅ `src/adapters/inbound/http/controllers/RentalController.ts`
- ✅ `src/adapters/inbound/http/controllers/EquipmentController.ts`
- ✅ `src/adapters/inbound/http/controllers/MemberController.ts`
- ✅ `src/adapters/inbound/http/controllers/ReservationController.ts`
- ✅ `src/adapters/inbound/http/middleware/errorHandler.ts`
- ✅ `src/adapters/inbound/http/dtos/RentalDTOs.ts`
- ✅ `src/adapters/inbound/http/dtos/EquipmentDTOs.ts`
- ✅ `src/adapters/inbound/http/dtos/MemberDTOs.ts`
- ✅ `src/adapters/inbound/http/dtos/ReservationDTOs.ts`
- ✅ `src/adapters/inbound/http/dtos/ErrorDTOs.ts`

**Tests created**:
- ✅ `src/adapters/inbound/http/controllers/__tests__/RentalController.test.ts`
- ✅ `src/adapters/inbound/http/controllers/__tests__/EquipmentController.test.ts`
- ✅ `src/adapters/inbound/http/controllers/__tests__/MemberController.test.ts`
- ✅ `src/adapters/inbound/http/controllers/__tests__/ReservationController.test.ts`
- ✅ `src/adapters/inbound/http/middleware/__tests__/errorHandler.test.ts`
- ✅ `src/adapters/inbound/http/__tests__/server.test.ts`

**Test Coverage**: 794 tests passing (45 new HTTP controller tests + 749 previous tests)

**Features implemented**:
- Full RESTful API endpoints for all major operations
- Request/Response DTOs with proper type safety
- Error handler middleware with domain exception mapping
- Health check endpoint
- Comprehensive test coverage with supertest
- Proper HTTP status codes (201, 200, 404, 409, 403, etc.)
- Request validation and error handling

## Phase 4: Infrastructure Layer

### 4.1 Dependency Injection Container ✅ COMPLETED
Wire all components together:

- [x] Create container that registers all dependencies
- [x] Map interfaces to implementations
- [x] Provide factory methods for use cases

**Files created**:
- ✅ `src/infrastructure/di/Container.ts`
- ✅ `src/infrastructure/di/types.ts` (DI tokens)

**Tests created**:
- ✅ `src/infrastructure/di/__tests__/Container.test.ts`

**Test Coverage**: 825 tests passing (31 new DI container tests + 794 previous tests)

**Features implemented**:
- Symbolic token-based dependency registration
- Singleton and transient lifecycle management
- Configuration-based adapter selection (in-memory vs. production)
- Automatic dependency wiring for repositories, services, handlers, and controllers
- Support for both testing (in-memory) and production (Prisma, Stripe) adapters
- Clean initialization and disposal hooks with Prisma connection management
- Type-safe dependency resolution

### 4.2 Configuration Management ✅ COMPLETED
Handle environment-specific settings:

- [x] Database connection strings
- [x] Payment API keys
- [x] Server port and host
- [x] Logging levels

**Files created**:
- ✅ `src/infrastructure/config/Config.ts`
- ✅ `src/infrastructure/config/DatabaseConfig.ts`
- ✅ `src/infrastructure/config/ServerConfig.ts`
- ✅ `.env.example` (enhanced)

**Tests created**:
- ✅ `src/infrastructure/config/__tests__/Config.test.ts`
- ✅ `src/infrastructure/config/__tests__/DatabaseConfig.test.ts`
- ✅ `src/infrastructure/config/__tests__/ServerConfig.test.ts`

**Test Coverage**: 879 tests passing (70 new configuration tests + 809 previous tests)

**Features implemented**:
- Type-safe configuration loading from environment variables
- Comprehensive validation for all configuration sections
- Support for multiple environments (development, test, production)
- Safe config logging with sensitive data masking
- Dotenv integration for .env file loading
- Database configuration with connection pooling settings
- Server configuration with CORS and request timeout settings
- Payment provider configuration (Stripe/Mock)
- Notification provider configuration (Email/Console)
- Logging configuration with multiple output destinations

### 4.3 Logging ✅ COMPLETED
Set up structured logging:

- [x] Choose logger (custom implementation with file/console output)
- [x] Configure log levels
- [x] Add request logging middleware

**Files created**:
- ✅ `src/infrastructure/logging/Logger.ts`
- ✅ `src/infrastructure/logging/RequestLogger.ts`

**Tests created**:
- ✅ `src/infrastructure/logging/__tests__/Logger.test.ts`
- ✅ `src/infrastructure/logging/__tests__/RequestLogger.test.ts`

**Test Coverage**: 948 tests passing (all existing tests still green)

**Features implemented**:
- Custom Logger implementation with structured logging support
- Multiple log levels (error, warn, info, debug)
- Configurable output formats (JSON, colored text)
- Multiple output destinations (console, file, both)
- NoOpLogger for testing scenarios
- Request logging middleware with correlation IDs
- HTTP request/response tracking with timing
- Configurable request body and response body logging
- Path exclusion for health checks
- Integration with DI container and application bootstrap
- Logger used throughout application lifecycle (startup, runtime, shutdown)
- Graceful error handling with fallback to console when logger not available

### 4.4 Application Bootstrap ✅ COMPLETED
Initialize and start the application:

- [x] Load configuration
- [x] Initialize database connections
- [x] Register dependencies in DI container
- [x] Start HTTP server
- [x] Set up graceful shutdown

**Files updated**:
- ✅ `src/index.ts` - Main entry point with complete bootstrap lifecycle
- ✅ `eslint.config.mjs` - Added NodeJS global for proper type recognition

**Tests created**:
- ✅ `src/__tests__/index.test.ts` - Comprehensive bootstrap tests (19 tests)

**Test Coverage**: 948 tests passing (19 new bootstrap tests + 929 previous tests)

**Features implemented**:
- Complete application lifecycle management
- 5-step initialization process with clear console feedback
- Configuration-based adapter selection (in-memory vs Prisma)
- Payment service selection (Mock vs Stripe)
- Notification service selection (Console vs Email)
- Automatic Prisma client creation with query logging support
- Graceful shutdown handlers (SIGTERM, SIGINT)
- Comprehensive error handling and logging
- Uncaught exception and unhandled rejection handlers
- Detailed startup information with endpoint listing
- Server error handling (port conflicts, startup failures)
- Clean resource cleanup on shutdown

## Phase 5: Testing

### 5.1 Unit Tests ✅ COMPLETED
Test domain logic in isolation:

- [x] Test all value objects
- [x] Test all entities
- [x] Test business rule enforcement
- [x] Test state transitions

**Files created**:
- ✅ `src/domain/entities/__tests__/Reservation.test.ts` (31 tests)
- ✅ `src/domain/entities/__tests__/DamageAssessment.test.ts` (27 tests)

**Test Coverage**: 1006 tests passing (58 new entity tests + 948 previous tests)

**Features tested**:
- All value objects (Money, DateRange, identifiers) - comprehensive coverage
- All entities (Equipment, Member, Rental, Reservation, DamageAssessment) - full lifecycle
- Business rule enforcement across all domain objects
- State transitions and state machine validation
- Edge cases, error scenarios, and boundary conditions

### 5.2 Integration Tests ✅ COMPLETED
Test use cases with in-memory adapters:

- [x] Test command handlers
- [x] Test query handlers
- [x] Test application services

**Files created**:
- ✅ `src/application/commands/__tests__/integration/CommandHandlers.integration.test.ts`
- ✅ `src/application/queries/__tests__/integration/QueryHandlers.integration.test.ts`
- ✅ `src/application/services/__tests__/integration/ApplicationServices.integration.test.ts`

**Test Coverage**: 1059 tests passing (12 new integration test suites + 1047 previous tests)

**Features tested**:
- Command handlers with real in-memory adapters instead of mocks
- Query handlers with actual data persistence and retrieval
- Application services with complex multi-step workflows
- Full integration between application layer and adapter layer
- Data persistence verification across multiple repositories
- Business logic validation in integrated scenarios

### 5.3 End-to-End Tests ✅ COMPLETED
Test complete flows through HTTP endpoints:

- [x] Test rental creation flow
- [x] Test return flow with late fees
- [x] Test reservation system
- [x] Test error scenarios

**Files created**:
- ✅ `src/__tests__/e2e/setup.ts`
- ✅ `src/__tests__/e2e/rental-flow.test.ts`
- ✅ `src/__tests__/e2e/return-flow.test.ts`
- ✅ `src/__tests__/e2e/reservation-flow.test.ts`
- ✅ `src/__tests__/e2e/error-scenarios.test.ts`

**Test Coverage**: Comprehensive E2E testing through HTTP endpoints (38 E2E test cases)

## Phase 6: Documentation and Deployment

### 6.1 API Documentation ✅ COMPLETED
Document the REST API:

- [x] Use Swagger/OpenAPI
- [x] Document all endpoints
- [x] Provide example requests/responses

**Files created**:
- ✅ `src/infrastructure/swagger/openapi.yaml` - Complete OpenAPI 3.0.3 specification
- ✅ `src/infrastructure/swagger/swagger.config.ts` - Swagger configuration and setup
- ✅ `src/infrastructure/swagger/__tests__/swagger.config.test.ts` - Comprehensive tests

**Files modified**:
- ✅ `src/adapters/inbound/http/server.ts` - Integrated Swagger UI middleware
- ✅ `src/adapters/inbound/http/__tests__/server.test.ts` - Added API documentation tests

**Test Coverage**: 1085 tests passing (24 new Swagger tests + 1061 previous tests)

**Features implemented**:
- Complete OpenAPI 3.0.3 specification with all REST endpoints documented
- Interactive Swagger UI accessible at /api-docs endpoint
- Documented endpoints: Equipment, Members, Rentals, Reservations, Health check
- Request/Response schemas with detailed examples for all operations
- Reusable component schemas for DTOs and error responses
- HTTP status codes (200, 201, 400, 403, 404, 409, 500) with examples
- Tags and operation grouping for better organization
- Custom Swagger UI styling and configuration options
- Fallback to swagger-jsdoc if YAML file unavailable
- Environment-agnostic path resolution using process.cwd()

**Dependencies installed**:
- swagger-ui-express - Swagger UI middleware for Express
- swagger-jsdoc - JSDoc-based OpenAPI generator (alternative approach)
- @types/swagger-ui-express - TypeScript types
- @types/swagger-jsdoc - TypeScript types
- yaml - YAML parser for OpenAPI specification

### 6.2 Docker Setup ✅ COMPLETED
Containerize the application:

- [x] Create `Dockerfile`
- [x] Create `docker-compose.yml` with database
- [x] Set up development and production configurations

**Files created**:
- ✅ `Dockerfile` - Multi-stage build (base, development, build, production)
- ✅ `.dockerignore` - Optimized build context exclusions
- ✅ `docker-compose.yml` - Development environment with PostgreSQL, Redis, Adminer
- ✅ `docker-compose.prod.yml` - Production environment with security and resource limits
- ✅ `.env.docker` - Docker-specific environment variables
- ✅ `.env.production.example` - Production deployment template

**Files modified**:
- ✅ `README.md` - Added comprehensive Docker deployment documentation

**Features implemented**:
- Multi-stage Dockerfile with optimal image size and security
- Development environment with hot reload support
- Production environment with non-root user, health checks, and resource limits
- PostgreSQL 16 database service
- Redis 7 for caching and session management
- Adminer database UI for development
- Nginx reverse proxy support (optional for production)
- Automatic Prisma migrations on startup
- Volume mounts for development persistence
- Environment configuration for different deployment scenarios
- Comprehensive documentation with usage examples

### 6.3 CI/CD Pipeline ✅ COMPLETED
Automate testing and deployment:

- [x] Set up GitHub Actions or similar
- [x] Run tests on push
- [x] Run linting and type checking
- [x] Build and deploy

**Files created**:
- ✅ `.github/workflows/ci.yml` - Main CI workflow with lint, typecheck, test, build jobs
- ✅ `.github/workflows/docker.yml` - Docker build and push workflow with multi-platform support
- ✅ `.github/workflows/release.yml` - Release automation with staging and production deployment
- ✅ `.github/workflows/security.yml` - Security scanning (dependency review, npm audit, CodeQL, secrets)
- ✅ `.github/CONTRIBUTING.md` - Comprehensive contribution guidelines with CI/CD process

**Files modified**:
- ✅ `README.md` - Added CI/CD badges and comprehensive documentation
- ✅ `src/__tests__/e2e/setup.ts` - Fixed TypeScript type casting for EquipmentCondition
- ✅ `src/__tests__/e2e/error-scenarios.test.ts` - Fixed entity property access (getId() → id)

**Features implemented**:
- **CI Workflow**: Runs on every push/PR with parallel jobs
  - Lint check with ESLint and Prettier
  - Type checking with TypeScript compiler
  - Tests on Node.js 18, 20, 22 with coverage reporting to Codecov
  - Build verification with artifact upload
  - Integration tests with PostgreSQL service
- **Docker Workflow**: Multi-platform image builds (AMD64/ARM64)
  - Push to GitHub Container Registry and Docker Hub
  - Intelligent tagging (semver, branch, SHA, latest)
  - Trivy security scanning with SARIF upload
  - Build caching for faster CI runs
- **Release Workflow**: Automated release process
  - Automatic changelog generation from git commits
  - GitHub Release creation with tarball artifacts
  - Staged deployment (staging → production)
  - Environment-based approvals for production
  - Smoke tests and deployment verification
- **Security Workflow**: Comprehensive security checks
  - Dependency review on PRs
  - Daily npm audit scans
  - CodeQL static analysis
  - TruffleHog secret scanning
  - License compatibility checking
  - SBOM (Software Bill of Materials) generation
- **Documentation**: Complete CI/CD setup guide
  - Workflow descriptions and usage
  - Required secrets configuration
  - Branch protection recommendations
  - Local CI testing instructions
  - Release process documentation
  - Contributing guidelines with quality standards

## Phase 7: Review Improvements

Based on the architectural review (REVIEW_1.md), the following improvements are recommended:

### 7.1 Money Value Object: Integer-Based Arithmetic ✅ COMPLETED
Convert the `Money` value object from floating-point to integer (cents) internally to eliminate floating-point precision issues. The public API (`amount` getter, `dollars()` factory) should remain dollar-based for backward compatibility, but all internal storage and arithmetic should use integer cents.

**Files modified**:
- ✅ `src/domain/value-objects/Money.ts` - Refactored to store cents internally as `_cents: number`
- ✅ `src/domain/value-objects/__tests__/Money.test.ts` - Added 15 new tests including precision edge-cases

**Acceptance criteria**:
- ✅ Internal storage uses integer cents (`_cents` private field)
- ✅ `amount` property still returns dollar value (backward compatible getter)
- ✅ `cents` getter exposes raw integer cents
- ✅ `fromCents(cents)` static factory added
- ✅ `add`, `subtract`, `multiply` use integer math
- ✅ All existing tests pass (1156 total)
- ✅ New tests cover floating-point edge cases (0.1 + 0.2 = 0.3, repeated additions, multiply drift)

### 7.2 HTTP Input Validation with Zod ✅ COMPLETED
Replace manual imperative validation in HTTP controllers with Zod schemas. Create validation schemas for all request DTOs and a reusable validation middleware.

**Files created**:
- ✅ `src/adapters/inbound/http/validation/schemas.ts` - Zod schemas for all request DTOs
- ✅ `src/adapters/inbound/http/validation/middleware.ts` - Reusable validation middleware

**Files modified**:
- ✅ `src/adapters/inbound/http/controllers/RentalController.ts` - Uses Zod schemas via middleware
- ✅ `src/adapters/inbound/http/controllers/ReservationController.ts` - Uses Zod schemas via middleware
- ✅ `package.json` - Added zod v4 dependency

**Notes**:
- `EquipmentController` and `MemberController` had no request body validation (read-only endpoints), so no changes were needed there.
- Used Zod v4 API (`issues` instead of `errors`, `error:` instead of `invalid_type_error:`).
- The `validateBody` middleware coerces missing bodies (`undefined`) to `{}` to support DELETE requests without a body (all-optional schemas like `cancelReservationSchema`).

**Acceptance criteria**:
- ✅ All manual validation replaced with Zod schemas
- ✅ Validation errors return structured `{ error: { code: 'VALIDATION_ERROR', message: '...' } }` responses
- ✅ All existing controller tests pass (1156 total)
- ✅ All E2E tests pass including DELETE-based cancellation endpoints

### 7.3 StripePaymentService: Persistent Payment Intent Storage ✅ COMPLETED
Replace the in-memory `Map<string, Stripe.PaymentIntent>` in `StripePaymentService` with a repository-backed persistent storage via a new port, maintaining the hexagonal architecture pattern.

**Files created**:
- ✅ `src/domain/ports/PaymentIntentRepository.ts` - Port for payment intent persistence
- ✅ `src/adapters/outbound/persistence/InMemoryPaymentIntentRepository.ts` - In-memory impl for testing
- ✅ `src/adapters/outbound/persistence/PrismaPaymentIntentRepository.ts` - Prisma impl for production

**Files modified**:
- ✅ `src/adapters/outbound/payment/StripePaymentService.ts` - Uses PaymentIntentRepository port
- ✅ `prisma/schema.prisma` - Added PaymentIntent model
- ✅ `src/infrastructure/di/Container.ts` - Wires InMemory/Prisma repository based on config
- ✅ `src/infrastructure/di/types.ts` - Added PaymentIntentRepository DI token

**Acceptance criteria**:
- ✅ Payment intents persisted via repository port
- ✅ In-memory and Prisma implementations available
- ✅ DI container wires the correct implementation based on config
- ✅ All existing payment tests pass (1156 tests total)

## Phase 8: Monorepo Migration & React Frontend

### 8.1 Monorepo Scaffolding ✅ COMPLETED
Migrate the existing single-package project to an npm workspaces monorepo with `packages/backend` and `packages/frontend`.

**Changes:**
- Create `packages/backend/` and `packages/frontend/` directories
- Move all backend source files (`src/`, `prisma/`, `jest.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.prettierrc`, `prisma.config.ts`) into `packages/backend/`
- Move backend `Dockerfile`, `.dockerignore`, `.env.example`, `.env.docker`, `.env.production.example` into `packages/backend/`
- Create root `package.json` with `"workspaces": ["packages/*"]` and shared scripts
- Create root `tsconfig.base.json` with shared compiler options (strict, ES2022, ESNext modules)
- Update `packages/backend/package.json`: name to `@equipmentrental/backend`, adjust script paths
- Update `packages/backend/tsconfig.json` to extend `../../tsconfig.base.json`
- Update all relative config references broken by the move (jest config, eslint config, prisma paths)
- Update `.github/workflows/ci.yml` to use workspace commands
- Move `docker-compose.yml` and `docker-compose.prod.yml` to root, update build contexts to `packages/backend/`

**Acceptance criteria:**
- ✅ `npm install` from root installs all workspace dependencies
- ✅ `npm test -w @equipmentrental/backend` runs all 1156 backend tests successfully
- ✅ `npm run build -w @equipmentrental/backend` compiles without errors
- ✅ `npm run lint -w @equipmentrental/backend` passes
- ✅ Docker compose still works with updated build context

**Test Coverage**: 1156 tests passing (all existing tests still green)

### 8.2 Frontend Project Setup ✅ COMPLETED
Scaffold a new React + TypeScript frontend using Vite in `packages/frontend/`.

**Files to create:**
- `packages/frontend/package.json` - named `@equipmentrental/frontend` with Vite, React, TypeScript deps
- `packages/frontend/tsconfig.json` - extends root base, adds React JSX settings
- `packages/frontend/tsconfig.node.json` - for Vite config
- `packages/frontend/vite.config.ts` - with API proxy to `http://localhost:3000` for dev
- `packages/frontend/index.html` - Vite entry HTML
- `packages/frontend/src/main.tsx` - React entry point
- `packages/frontend/src/App.tsx` - Root app component with placeholder
- `packages/frontend/src/vite-env.d.ts` - Vite type declarations
- `packages/frontend/eslint.config.mjs` - ESLint config matching backend style + React rules
- `packages/frontend/.prettierrc` - symlink or copy of backend config

**Dependencies:** react, react-dom, typescript, vite, @vitejs/plugin-react, tailwindcss, @tailwindcss/vite

**Files created:**
- ✅ `packages/frontend/package.json` - named `@equipmentrental/frontend` with Vite, React, TypeScript deps
- ✅ `packages/frontend/tsconfig.json` - extends root base, adds React JSX settings
- ✅ `packages/frontend/tsconfig.node.json` - for Vite config
- ✅ `packages/frontend/vite.config.ts` - with API proxy to `http://localhost:3000` for dev
- ✅ `packages/frontend/index.html` - Vite entry HTML
- ✅ `packages/frontend/src/main.tsx` - React entry point
- ✅ `packages/frontend/src/App.tsx` - Root app component with placeholder
- ✅ `packages/frontend/src/index.css` - Tailwind v4 CSS entry
- ✅ `packages/frontend/src/vite-env.d.ts` - Vite type declarations
- ✅ `packages/frontend/eslint.config.mjs` - ESLint config with React rules
- ✅ `packages/frontend/.prettierrc` - Prettier config matching backend style

**Acceptance criteria:**
- ✅ `npm run build -w @equipmentrental/frontend` produces production build
- ✅ `npm run typecheck -w @equipmentrental/frontend` passes
- ✅ `npm run lint -w @equipmentrental/frontend` passes
- ✅ API proxy configured to forward `/api/*` requests to backend at localhost:3000
- ✅ Tailwind CSS v4 set up with @tailwindcss/vite plugin (no postcss, no tailwind.config.js)
- ✅ All 1156 backend tests still pass

### 8.3 Frontend Docker & Compose Integration ✅ COMPLETED
Create a Docker setup for the frontend and integrate with existing compose files.

**Files created:**
- ✅ `packages/frontend/Dockerfile` - multi-stage build: node:20-alpine (build) → nginx:alpine (serve)
- ✅ `packages/frontend/nginx.conf` - nginx config with SPA fallback, `/api` proxy to `app:3000`, gzip compression, and static asset cache headers
- ✅ `packages/frontend/.dockerignore` - excludes node_modules, dist, .env*, etc.

**Files modified:**
- ✅ `docker-compose.yml` - added `frontend` service (node:20-alpine with Vite dev server on port 5173, volume mounts for hot reload)
- ✅ `docker-compose.prod.yml` - added `frontend` service (port 80, nginx multi-stage build serving static files with API proxy to backend)

**Acceptance criteria:**
- ✅ `docker compose up` starts both backend and frontend
- ✅ Frontend dev server accessible at localhost:5173
- ✅ API requests from frontend proxy to backend correctly (nginx `/api/` → `http://app:3000`)
- ✅ Production build serves static files via nginx
- ✅ All 1156 backend tests still pass

### 8.4 API Client & Shared Types
Create typed API client and TypeScript interfaces matching backend DTOs.

**Files to create:**
- `packages/frontend/src/types/api.ts` - TypeScript interfaces for all API entities (Equipment, Member, Rental, Reservation, error responses)
- `packages/frontend/src/api/client.ts` - Typed fetch wrapper with base URL config, error handling, and methods for all backend endpoints
- `packages/frontend/src/api/equipment.ts` - Equipment API functions (list, get, create, update)
- `packages/frontend/src/api/members.ts` - Member API functions (list, get, create, update)
- `packages/frontend/src/api/rentals.ts` - Rental API functions (create, get, return, extend, list by member)
- `packages/frontend/src/api/reservations.ts` - Reservation API functions (create, get, confirm, cancel, fulfill)
- `packages/frontend/src/hooks/useApi.ts` - Generic React hook for data fetching with loading/error states

**Acceptance criteria:**
- All API types match backend DTO interfaces
- API client handles base URL from environment variable (`VITE_API_URL`)
- Error responses are typed and handled consistently
- `useApi` hook provides loading, error, and data states

### 8.5 App Shell, Routing & Layout ✅ COMPLETED
Set up the core application structure with navigation and routing.

**Dependencies:** react-router-dom

**Files to create:**
- `packages/frontend/src/App.tsx` - Replace placeholder with router setup
- `packages/frontend/src/layouts/AppLayout.tsx` - Main layout with sidebar nav + header + content area
- `packages/frontend/src/components/Sidebar.tsx` - Navigation sidebar with links to all sections
- `packages/frontend/src/components/Header.tsx` - Top header bar
- `packages/frontend/src/pages/DashboardPage.tsx` - Placeholder dashboard
- `packages/frontend/src/pages/EquipmentListPage.tsx` - Placeholder
- `packages/frontend/src/pages/MembersListPage.tsx` - Placeholder
- `packages/frontend/src/pages/RentalsPage.tsx` - Placeholder
- `packages/frontend/src/pages/ReservationsPage.tsx` - Placeholder
- `packages/frontend/src/router.tsx` - Route definitions

**Acceptance criteria:**
- Sidebar navigation renders with links: Dashboard, Equipment, Members, Rentals, Reservations
- Routes navigate to correct placeholder pages
- Layout is responsive (sidebar collapses on mobile)
- Active route is highlighted in sidebar

### 8.6 Equipment Management Pages ✅ COMPLETED
Build full CRUD UI for equipment.

**Files created:**
- ✅ `packages/frontend/src/pages/EquipmentListPage.tsx` - Table with search, filter by category/condition, loading/error/empty states
- ✅ `packages/frontend/src/pages/EquipmentDetailPage.tsx` - Equipment details with condition/availability badges and edit button
- ✅ `packages/frontend/src/pages/EquipmentFormPage.tsx` - Create/edit form with client-side validation
- ✅ `packages/frontend/src/components/equipment/EquipmentTable.tsx` - Reusable table with desktop table + mobile card layout
- ✅ `packages/frontend/src/components/equipment/EquipmentStatusBadge.tsx` - ConditionBadge + AvailabilityBadge components
- ✅ `packages/frontend/src/components/equipment/EquipmentFilters.tsx` - Search input, category dropdown, condition dropdown

**Files modified:**
- ✅ `packages/frontend/src/router.tsx` - Added `/equipment/new`, `/equipment/:id`, `/equipment/:id/edit` routes

**API endpoints used:** `GET /api/equipment/available`, `GET /api/equipment/:id`, `POST /api/equipment`, `PUT /api/equipment/:id`

**Acceptance criteria:**
- ✅ Equipment list loads from API with loading/error states
- ✅ Search and filters work (category, condition)
- ✅ Create form validates inputs and submits to API
- ✅ Detail page shows equipment info and current rental status

### 8.7 Member Management Pages ✅ COMPLETED
Build full CRUD UI for members.

**Files created:**
- ✅ `packages/frontend/src/pages/MembersListPage.tsx` - Table with search, filter by tier/status, loading/error/empty states
- ✅ `packages/frontend/src/pages/MemberDetailPage.tsx` - Profile, active rentals, rental history
- ✅ `packages/frontend/src/pages/MemberFormPage.tsx` - Create/edit member form with validation
- ✅ `packages/frontend/src/components/members/MemberTable.tsx` - Reusable table with desktop table + mobile card layout
- ✅ `packages/frontend/src/components/members/TierBadge.tsx` - TierBadge + ActiveStatusBadge components
- ✅ `packages/frontend/src/components/members/MemberFilters.tsx` - Search input, tier dropdown, status dropdown

**Files modified:**
- ✅ `packages/frontend/src/router.tsx` - Added `/members/new`, `/members/:id`, `/members/:id/edit` routes

**API endpoints used:** `GET /api/members`, `GET /api/members/:id`, `POST /api/members`, `PUT /api/members/:id`, `GET /api/members/:id/rentals`

**Acceptance criteria:**
- ✅ Member list loads from API with search and tier filtering
- ✅ Member detail shows profile and associated rentals
- ✅ Create/edit form validates and submits correctly
- ✅ Tier badge shows correct color/label per tier level (BASIC=gray, SILVER=slate, GOLD=amber, PLATINUM=purple)

### 8.8 Rental Workflow Pages ✅ COMPLETED
Build the complete rental lifecycle UI.

**Files created:**
- ✅ `packages/frontend/src/pages/RentalsPage.tsx` - Overdue rentals section, member-ID search, "Create Rental" button
- ✅ `packages/frontend/src/pages/CreateRentalPage.tsx` - Form with equipment/member/date/payment selectors and success result
- ✅ `packages/frontend/src/pages/RentalDetailPage.tsx` - Rental details with Return/Extend action buttons
- ✅ `packages/frontend/src/components/rentals/RentalTable.tsx` - Table with desktop/mobile layouts, clickable rows
- ✅ `packages/frontend/src/components/rentals/RentalStatusBadge.tsx` - ACTIVE=green, RESERVED=blue, OVERDUE=red, RETURNED=gray, CANCELLED=gray-light
- ✅ `packages/frontend/src/components/rentals/ReturnRentalDialog.tsx` - Modal with condition dropdown, success result with fees
- ✅ `packages/frontend/src/components/rentals/ExtendRentalDialog.tsx` - Modal with days input, success result with new end date

**Files modified:**
- ✅ `packages/frontend/src/router.tsx` - Added `/rentals/new` → CreateRentalPage, `/rentals/:id` → RentalDetailPage

**API endpoints used:** `POST /api/rentals`, `GET /api/rentals/:id`, `PUT /api/rentals/:id/return`, `PUT /api/rentals/:id/extend`, `GET /api/rentals/member/:memberId`, `GET /api/rentals/status/overdue`

**Acceptance criteria:**
- ✅ Rental creation form guides user through equipment/member/date selection
- ✅ Overdue rentals list shows rentals with status badges
- ✅ Return flow shows condition selector and fee details after confirming
- ✅ Extend flow shows additional cost and new end date after confirming

### 8.9 Reservation Management Pages ✅ COMPLETED
Build reservation lifecycle UI.

**Files created:**
- ✅ `packages/frontend/src/pages/ReservationsPage.tsx` - Search-by-ID lookup, recently viewed session list, Create Reservation button
- ✅ `packages/frontend/src/pages/CreateReservationPage.tsx` - Equipment/member/date/payment form with validation and success result
- ✅ `packages/frontend/src/pages/ReservationDetailPage.tsx` - Details with confirm/cancel/fulfill inline confirmation
- ✅ `packages/frontend/src/components/reservations/ReservationTable.tsx` - Desktop table + mobile card layout, clickable rows
- ✅ `packages/frontend/src/components/reservations/ReservationStatusBadge.tsx` - PENDING=yellow, CONFIRMED=blue, CANCELLED=gray, FULFILLED=green, EXPIRED=red

**Files modified:**
- ✅ `packages/frontend/src/router.tsx` - Added `/reservations/new` and `/reservations/:id` routes

**API endpoints used:** `POST /api/reservations`, `GET /api/reservations/:id`, `PUT /api/reservations/:id/confirm`, `DELETE /api/reservations/:id`, `PUT /api/reservations/:id/fulfill`

**Acceptance criteria:**
- ✅ Search-by-ID lookup with instant preview card and recently-viewed session list
- ✅ Create form with equipment/member dropdowns, future-only dates, payment method
- ✅ Action buttons for confirm/cancel/fulfill with inline confirmation widgets (no browser confirm())
- ✅ Status-based action gating: PENDING shows Confirm+Cancel, CONFIRMED shows Fulfill+Cancel, terminal statuses show info banner
- ✅ All checks pass: typecheck, lint, build

### 8.10 Dashboard Page ✅ COMPLETED
Build a summary dashboard with key metrics.

**Files created:**
- ✅ `packages/frontend/src/pages/DashboardPage.tsx` - Full dashboard layout
- ✅ `packages/frontend/src/components/dashboard/StatCard.tsx` - Metric card component
- ✅ `packages/frontend/src/components/dashboard/RecentActivityList.tsx` - Overdue rental list
- ✅ `packages/frontend/src/components/dashboard/EquipmentAvailabilityChart.tsx` - Visual availability overview

**API endpoints used:** `GET /api/equipment/available`, `GET /api/rentals/status/overdue`, `GET /api/members`

**Acceptance criteria:**
- ✅ Summary cards: available equipment count, total members, overdue rentals, equipment utilisation %
- ✅ Equipment availability chart (horizontal stacked bar, no chart library)
- ✅ Recent overdue rentals list with status badges and links to detail pages
- ✅ Independent loading states per section; coloured left-border StatCards linking to relevant pages
- ✅ `npm run typecheck -w @equipmentrental/frontend` passes
- ✅ `npm run lint -w @equipmentrental/frontend` passes
- ✅ `npm run build -w @equipmentrental/frontend` succeeds

### 8.11 CI/CD & Vercel Configuration ✅ COMPLETED
Update CI pipeline for monorepo and add Vercel deployment config.

**Files modified:**
- ✅ `.github/workflows/ci.yml` - Added frontend-lint, frontend-typecheck, frontend-build jobs (run in parallel with backend jobs; frontend-build depends on the other two)
- ✅ `.github/workflows/docker.yml` - Refactored into build-backend and build-frontend jobs; each image tagged with -backend / -frontend suffix; scoped GHA cache; security scan covers both images

**Files created:**
- ✅ `packages/frontend/vercel.json` - Vercel build config (vite framework, dist output, /api/* rewrite placeholder)
- ✅ Root `package.json` - Added dev, dev:backend, dev:frontend convenience scripts

**Acceptance criteria:**
- ✅ CI runs both backend and frontend lint/typecheck/build
- ✅ Docker workflow builds both images with separate tags
- ✅ Vercel config correctly rewrites `/api/*` to backend service URL
- ✅ `npm run build` from root builds both workspaces

**Test Coverage**: 1156 backend tests passing; frontend lint/typecheck/build all green

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
