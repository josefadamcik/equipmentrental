# Equipment Rental System

[![CI](https://github.com/YOUR_USERNAME/equipmentrental/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/equipmentrental/actions/workflows/ci.yml)
[![Docker](https://github.com/YOUR_USERNAME/equipmentrental/actions/workflows/docker.yml/badge.svg)](https://github.com/YOUR_USERNAME/equipmentrental/actions/workflows/docker.yml)
[![Security](https://github.com/YOUR_USERNAME/equipmentrental/actions/workflows/security.yml/badge.svg)](https://github.com/YOUR_USERNAME/equipmentrental/actions/workflows/security.yml)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/equipmentrental/branch/master/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/equipmentrental)

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
- Docker and Docker Compose (optional, for containerized deployment)

### Installation

```bash
npm install
```

### Development

#### Running Locally (without Docker)

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

#### Running with Docker (Recommended)

Docker provides a complete development environment with PostgreSQL, Redis, and Adminer (database UI).

```bash
# Start all services (app, PostgreSQL, Redis, Adminer)
docker-compose up

# Start in detached mode (background)
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Rebuild containers after code changes
docker-compose up --build
```

**Access Points:**
- Application API: http://localhost:3000
- API Documentation: http://localhost:3000/api-docs
- Adminer (Database UI): http://localhost:8080
  - System: PostgreSQL
  - Server: postgres
  - Username: equipmentrental
  - Password: dev_password_change_in_production
  - Database: equipmentrental

### Build

```bash
# Build for production (local)
npm run build

# Run production build (local)
npm start

# Clean build artifacts
npm run clean

# Build Docker image for production
docker build --target production -t equipmentrental:latest .

# Run production container
docker-compose -f docker-compose.prod.yml up -d
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

## Docker Deployment

### Architecture

The application uses a multi-stage Dockerfile for optimal image size and security:

1. **Base Stage**: Common dependencies and setup
2. **Development Stage**: Full dev dependencies with hot reload
3. **Build Stage**: TypeScript compilation
4. **Production Stage**: Minimal runtime image with non-root user

### Development Environment

The development Docker Compose setup includes:

- **Application**: Node.js app with hot reload (port 3000)
- **PostgreSQL**: Database server (port 5432)
- **Redis**: Caching and session store (port 6379)
- **Adminer**: Database management UI (port 8080)

### Production Deployment

For production, use `docker-compose.prod.yml`:

```bash
# Copy and configure production environment
cp .env.production.example .env.production
# Edit .env.production with your production values

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# View production logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop production services
docker-compose -f docker-compose.prod.yml down
```

**Production Features:**
- Multi-stage build for minimal image size
- Non-root user for security
- Health checks for all services
- Resource limits and reservations
- SSL-ready with Nginx reverse proxy (optional)
- Automatic database migrations on startup
- Redis with password protection

### Environment Configuration

Three environment file templates are provided:

- `.env.example` - Local development (SQLite)
- `.env.docker` - Docker development (PostgreSQL)
- `.env.production.example` - Production deployment

Copy the appropriate template to `.env` based on your deployment method.

### Useful Docker Commands

```bash
# Build specific stage
docker build --target development -t equipmentrental:dev .
docker build --target production -t equipmentrental:prod .

# Run database migrations
docker-compose exec app npx prisma migrate deploy

# Access database shell
docker-compose exec postgres psql -U equipmentrental -d equipmentrental

# Access Redis CLI
docker-compose exec redis redis-cli

# View real-time logs
docker-compose logs -f

# Restart a specific service
docker-compose restart app

# Scale the application (multiple instances)
docker-compose up -d --scale app=3
```

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment.

### Workflows

#### CI Workflow (`.github/workflows/ci.yml`)
Runs on every push and pull request to main branches:

- **Lint**: ESLint and Prettier checks
- **Type Check**: TypeScript compilation validation
- **Test**: Unit, integration, and E2E tests on Node.js 18, 20, 22
- **Build**: TypeScript compilation and artifact creation
- **Integration Tests**: Full test suite against PostgreSQL database

#### Docker Workflow (`.github/workflows/docker.yml`)
Builds and publishes Docker images:

- **Multi-platform builds**: AMD64 and ARM64 support
- **Image registries**: GitHub Container Registry and Docker Hub
- **Security scanning**: Trivy vulnerability scanner
- **Tagging strategy**: Branch names, semver tags, git SHA, latest

#### Release Workflow (`.github/workflows/release.yml`)
Automated releases on version tags:

- **GitHub Releases**: Automatic changelog generation
- **Release artifacts**: Tarball with compiled code
- **Deployment**: Staging and production deployment automation
- **Smoke tests**: Post-deployment verification

#### Security Workflow (`.github/workflows/security.yml`)
Daily security scans and PR reviews:

- **Dependency Review**: Check new dependencies in PRs
- **NPM Audit**: Vulnerability scanning
- **CodeQL**: Static code analysis for security issues
- **Secrets Scanning**: Detect accidentally committed secrets
- **License Check**: Ensure compatible open-source licenses
- **SBOM Generation**: Software Bill of Materials for compliance

### Setting Up CI/CD

#### Required Secrets

Configure these in your GitHub repository settings (Settings → Secrets and variables → Actions):

**Docker Hub (optional):**
- `DOCKERHUB_USERNAME`: Your Docker Hub username
- `DOCKERHUB_TOKEN`: Docker Hub access token

**Codecov (optional):**
- `CODECOV_TOKEN`: Token from codecov.io for coverage reports

#### Branch Protection

Recommended branch protection rules for `main`/`master`:

1. **Require pull request reviews**: At least 1 approval
2. **Require status checks**: All CI jobs must pass
3. **Require branches to be up to date**: Prevent stale PRs
4. **Include administrators**: Apply rules to everyone

### Local CI Testing

Run the same checks locally before pushing:

```bash
# Run all quality checks
npm run typecheck    # Type checking
npm run lint         # Linting
npm run format:check # Format checking
npm test             # All tests
npm run build        # Build verification

# Or run them all at once
npm run typecheck && npm run lint && npm run format:check && npm test && npm run build
```

### Release Process

1. **Update version** in `package.json`:
   ```bash
   npm version patch  # 1.0.0 → 1.0.1
   npm version minor  # 1.0.0 → 1.1.0
   npm version major  # 1.0.0 → 2.0.0
   ```

2. **Push tags**:
   ```bash
   git push origin master --tags
   ```

3. **Automated actions**:
   - GitHub Release created with changelog
   - Docker images built and pushed
   - Deployment to staging (RC and stable releases)
   - Deployment to production (stable releases only)

### Deployment Environments

- **Staging**: Auto-deployed on RC releases (`v*.*.*-rc*`)
- **Production**: Auto-deployed on stable releases (`v*.*.*`)
- **Manual approval**: Production deployments require approval in GitHub

## Technology Stack

- **Runtime**: Node.js (ES Modules)
- **Language**: TypeScript 5.9+
- **Module System**: ESM (ES Modules)
- **Testing**: Jest with ts-jest
- **Code Quality**: ESLint 9 (flat config), Prettier
- **Build**: TypeScript Compiler (tsc)
- **Dev Server**: tsx (fast TypeScript runner with watch mode)
- **Containerization**: Docker and Docker Compose
- **Database**: PostgreSQL 16 (production), SQLite (local dev)
- **Caching**: Redis 7
- **CI/CD**: GitHub Actions
- **Security**: CodeQL, Trivy, TruffleHog, npm audit

## Future Enhancements

- Authentication & Authorization (JWT, OAuth)
- Reservation queue system with priority handling
- Advanced maintenance scheduling with predictive analytics
- Reporting & analytics dashboard
- GraphQL API adapter
- WebSocket support for real-time updates
- Multi-tenancy support
- Advanced caching strategies with Redis
- Rate limiting and API throttling
- Comprehensive monitoring and observability (Prometheus, Grafana)
- Event sourcing and CQRS for audit trails

## Resources

### Hexagonal Architecture
- [Alistair Cockburn - Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Netflix - Ready for changes with Hexagonal Architecture](https://netflixtechblog.com/ready-for-changes-with-hexagonal-architecture-b315ec967749)

### Domain-Driven Design
- [DDD Reference by Eric Evans](https://www.domainlanguage.com/ddd/reference/)
- [Martin Fowler - Domain-Driven Design](https://martinfowler.com/tags/domain%20driven%20design.html)

### ES Modules
- [ESM Guide](ESM_GUIDE.md) - Project-specific ESM documentation
- [Node.js ESM Documentation](https://nodejs.org/api/esm.html)
- [TypeScript ESM Support](https://www.typescriptlang.org/docs/handbook/esm-node.html)

## License

MIT
