# Contributing to Equipment Rental System

Thank you for your interest in contributing to the Equipment Rental System! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [CI/CD Pipeline](#cicd-pipeline)
- [Code Quality Standards](#code-quality-standards)
- [Testing Requirements](#testing-requirements)

## Code of Conduct

This project follows a standard code of conduct:

- Be respectful and inclusive
- Focus on constructive feedback
- Accept responsibility and apologize for mistakes
- Prioritize the community's best interests

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/equipmentrental.git
   cd equipmentrental
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a branch** for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### 1. Make Your Changes

Follow the hexagonal architecture principles:

- **Domain changes**: Pure business logic in `src/domain/`
- **Application changes**: Use cases in `src/application/`
- **Adapter changes**: Infrastructure in `src/adapters/`
- **Infrastructure changes**: Cross-cutting concerns in `src/infrastructure/`

### 2. Write Tests

All code must have accompanying tests:

- **Domain**: Unit tests for entities and value objects
- **Application**: Integration tests for commands/queries
- **Adapters**: Adapter tests with mocks or real implementations
- **E2E**: End-to-end tests for critical user flows

### 3. Run Quality Checks

Before committing, ensure all checks pass:

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format checking
npm run format:check

# Auto-format code
npm run format

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build
npm run build
```

### 4. Commit Your Changes

Follow conventional commit format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Build process or auxiliary tool changes

**Examples:**
```bash
git commit -m "feat(domain): add equipment reservation system"
git commit -m "fix(api): correct rental date validation"
git commit -m "test(integration): add rental service tests"
```

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

## Pull Request Process

### 1. Create Pull Request

- Use a clear, descriptive title
- Fill out the PR template completely
- Reference any related issues (#123)
- Add labels (feature, bugfix, documentation, etc.)

### 2. PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to break)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] All tests passing locally

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests provide adequate coverage
```

### 3. CI Checks

Your PR must pass all automated checks:

#### Lint Check
- ESLint rules enforced
- Prettier formatting verified
- No linting errors or warnings

#### Type Check
- TypeScript compilation successful
- No type errors
- Strict mode compliance

#### Tests
- All unit tests pass
- All integration tests pass
- All E2E tests pass
- Coverage meets minimum threshold (80%)

#### Build
- TypeScript builds successfully
- No compilation errors
- Artifacts generated correctly

#### Security
- No new vulnerabilities introduced
- Dependency review passed
- No secrets committed

### 4. Code Review

- Address reviewer feedback promptly
- Keep discussions focused and professional
- Make requested changes in new commits
- Don't force-push after review starts

### 5. Merge

Once approved and all checks pass:
- Squash commits if requested
- Update with latest main branch
- Maintainer will merge

## CI/CD Pipeline

### Automated Workflows

#### On Every Push/PR

1. **Lint Workflow**: Code style and formatting
2. **Type Check Workflow**: TypeScript validation
3. **Test Workflow**: All test suites on Node 18, 20, 22
4. **Build Workflow**: Compilation and artifact creation
5. **Integration Workflow**: Database-backed tests
6. **Security Workflow**: Vulnerability and secret scanning

#### On Merge to Main

1. **Docker Build**: Multi-platform image creation
2. **Image Push**: Deploy to container registries
3. **Security Scan**: Trivy vulnerability analysis

#### On Version Tag

1. **Release Creation**: GitHub release with changelog
2. **Artifact Upload**: Release tarball
3. **Staging Deployment**: Deploy to staging environment
4. **Production Deployment**: Deploy to production (manual approval)

### Running CI Locally

Use Docker to replicate CI environment:

```bash
# Run in CI-like environment
docker run --rm -v $(pwd):/app -w /app node:20 bash -c "
  npm ci &&
  npx prisma generate &&
  npm run typecheck &&
  npm run lint &&
  npm run format:check &&
  npm test &&
  npm run build
"
```

## Code Quality Standards

### TypeScript

- Use strict mode
- No `any` types (use `unknown` if needed)
- Explicit return types for functions
- Use type inference where appropriate
- Prefer interfaces for public contracts
- Use type aliases for complex types

### Code Style

- Follow ESLint rules
- Use Prettier for formatting
- Maximum line length: 100 characters
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

### Architecture

- Follow hexagonal architecture principles
- Domain layer has no external dependencies
- Use dependency injection
- Define ports (interfaces) before adapters
- Keep business logic in domain layer
- Use value objects for domain concepts

### Testing

- Aim for 80%+ code coverage
- Test behavior, not implementation
- Use meaningful test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Test edge cases and error scenarios

## Testing Requirements

### Minimum Coverage

- Overall: 80%
- Domain layer: 90%+
- Application layer: 85%+
- Adapters: 75%+

### Test Categories

1. **Unit Tests**: Domain entities, value objects, exceptions
2. **Integration Tests**: Application services, command/query handlers
3. **Adapter Tests**: Repository implementations, external services
4. **E2E Tests**: Complete user flows through API

### Test Naming

```typescript
// Good
describe('Rental', () => {
  describe('extend', () => {
    it('should extend rental period when no conflicts exist', () => {
      // test
    });

    it('should throw error when equipment has conflicting reservation', () => {
      // test
    });
  });
});

// Bad
describe('test', () => {
  it('works', () => {
    // test
  });
});
```

## Questions?

- Open an issue for bugs or feature requests
- Use discussions for questions and ideas
- Check existing issues before creating new ones
- Provide as much context as possible

Thank you for contributing!
