# Equipment Rental System

[![CI](https://github.com/YOUR_USERNAME/equipmentrental/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/equipmentrental/actions/workflows/ci.yml)
[![Docker](https://github.com/YOUR_USERNAME/equipmentrental/actions/workflows/docker.yml/badge.svg)](https://github.com/YOUR_USERNAME/equipmentrental/actions/workflows/docker.yml)
[![Security](https://github.com/YOUR_USERNAME/equipmentrental/actions/workflows/security.yml/badge.svg)](https://github.com/YOUR_USERNAME/equipmentrental/actions/workflows/security.yml)

A full-stack equipment rental management system built with **Hexagonal Architecture** (Ports and Adapters) on the backend and **React + TypeScript** on the frontend.

## Project Structure

This is an **npm workspaces monorepo** with two packages:

```
equipmentrental/
├── packages/
│   ├── backend/              # Node.js + Express API (Hexagonal Architecture)
│   │   ├── src/
│   │   │   ├── domain/       # Core business logic (entities, value objects, ports)
│   │   │   ├── application/  # Use cases (commands, queries, services)
│   │   │   ├── adapters/     # Inbound (HTTP) and outbound (DB, payment, notification)
│   │   │   └── infrastructure/ # DI container, config, logging
│   │   ├── prisma/           # Database schema and migrations
│   │   └── Dockerfile
│   │
│   └── frontend/             # React + Vite SPA
│       ├── src/
│       │   ├── api/          # Typed API client
│       │   ├── components/   # Reusable UI components
│       │   ├── hooks/        # React hooks (useApi)
│       │   ├── layouts/      # App shell layout
│       │   ├── pages/        # Route pages
│       │   └── types/        # API type definitions
│       ├── nginx.conf        # Production nginx config
│       └── Dockerfile
│
├── docker-compose.yml        # Development environment
├── docker-compose.prod.yml   # Production environment
└── package.json              # Workspace root
```

## Core Domain Concepts

### Entities
- **Equipment**: Items available for rent with availability tracking and condition monitoring
- **Rental**: Central aggregate managing the rental lifecycle (active → overdue → returned)
- **Member**: Customers with membership tiers (BASIC, SILVER, GOLD, PLATINUM) and privileges
- **Reservation**: Future rental bookings with confirmation and cancellation

### Key Business Rules
- Tier-based rental limits, discounts, and maximum rental periods
- Late fee calculation and damage assessment on return
- Reservation conflict detection and equipment availability management
- Payment processing via Stripe (or mock for development)

## Getting Started

### Prerequisites
- Node.js 20+
- npm 9+
- Docker and Docker Compose (optional)

### Installation

```bash
# Install all workspace dependencies from the project root
npm install
```

### Development (Local)

```bash
# Start both backend and frontend dev servers
npm run dev

# Or start them individually
npm run dev:backend     # Backend on http://localhost:3000
npm run dev:frontend    # Frontend on http://localhost:5173
```

The Vite dev server proxies `/api` requests to the backend automatically.

**Other commands:**

```bash
# Backend
npm test -w @equipmentrental/backend          # Run all 1156 tests
npm run test:watch -w @equipmentrental/backend # Watch mode
npm run test:coverage -w @equipmentrental/backend
npm run typecheck -w @equipmentrental/backend
npm run lint -w @equipmentrental/backend

# Frontend
npm run build -w @equipmentrental/frontend
npm run typecheck -w @equipmentrental/frontend
npm run lint -w @equipmentrental/frontend

# All workspaces
npm run build       # Build everything
npm run lint        # Lint everything
npm run typecheck   # Type-check everything
```

### Development (Docker)

Docker provides a complete environment with PostgreSQL, Redis, and hot reload for both services.

```bash
# Start all services (backend, frontend, PostgreSQL, Redis, Adminer)
docker compose up

# Start in background
docker compose up -d

# View logs
docker compose logs -f app        # Backend logs
docker compose logs -f frontend   # Frontend logs

# Stop all services
docker compose down

# Rebuild after dependency changes
docker compose up --build
```

**Access points:**

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| API Documentation (Swagger) | http://localhost:3000/api-docs |
| Adminer (Database UI) | http://localhost:8080 |

### Production (Docker)

```bash
# Configure production environment
cp packages/backend/.env.production.example .env.production
# Edit .env.production with your values

# Start production services
docker compose -f docker-compose.prod.yml up -d
```

In production, the frontend is served by nginx (port 80) which also proxies `/api` and `/api-docs` to the backend.

### Build

```bash
# Build both packages
npm run build

# Build Docker images separately
docker build -t equipmentrental-backend:latest packages/backend
docker build -t equipmentrental-frontend:latest packages/frontend
```

## Architecture

### Backend - Hexagonal Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Inbound Adapters                         │
│              (HTTP Controllers, Validation)                 │
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
│     (Prisma DB, Stripe Payments, Email Notifications)      │
└─────────────────────────────────────────────────────────────┘
```

**Key principles:**
- Domain layer has zero external dependencies (pure TypeScript)
- All external integrations go through ports (interfaces)
- Adapters are swappable via dependency injection (in-memory for tests, Prisma/Stripe for production)

### Frontend - React SPA

- **Vite** for fast builds and HMR
- **React Router** for client-side routing
- **Tailwind CSS v4** for utility-first styling
- **Typed API client** matching backend DTOs
- Pages: Dashboard, Equipment, Members, Rentals, Reservations (full CRUD)

### Deployment

- **Vercel**: Frontend can be deployed to Vercel with the included `vercel.json` config
- **Docker**: Separate images for backend (Node.js) and frontend (nginx)
- **CI/CD**: GitHub Actions workflows for lint, test, build, Docker, security scanning

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS v4 |
| Backend | Node.js, TypeScript, Express 5, Prisma ORM |
| Database | PostgreSQL 16 (production), SQLite (local dev) |
| Payments | Stripe (production), Mock (development) |
| Testing | Jest (1156 tests), Supertest |
| Quality | ESLint 9, Prettier, TypeScript strict mode |
| Infrastructure | Docker, GitHub Actions, Vercel |

## License

MIT
