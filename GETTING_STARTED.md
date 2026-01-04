# Getting Started

Welcome to the Equipment Rental System project! This guide will help you get started with development.

## ✅ Project Setup Complete

The project has been initialized with:
- ✅ TypeScript configuration with strict mode
- ✅ Hexagonal architecture directory structure
- ✅ ESLint for code quality
- ✅ Prettier for code formatting
- ✅ Jest for testing
- ✅ Build and development scripts
- ✅ Git repository initialized

## 📋 Available Commands

### Development
```bash
npm run dev              # Run with hot reload (nodemon + ts-node)
npm run build            # Compile TypeScript to JavaScript
npm start                # Run the compiled application
npm run clean            # Remove build artifacts
```

### Testing
```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

### Code Quality
```bash
npm run typecheck        # TypeScript type checking
npm run lint             # Check for linting errors
npm run lint:fix         # Auto-fix linting errors
npm run format           # Format code with Prettier
npm run format:check     # Check if code is formatted
```

### All Quality Checks
```bash
npm test && npm run typecheck && npm run lint && npm run format:check
```

## 🏗️ Project Structure

```
src/
├── domain/              # Core business logic (no dependencies)
│   ├── entities/        # Business entities
│   ├── value-objects/   # Immutable value objects
│   ├── ports/           # Interface definitions
│   ├── events/          # Domain events
│   ├── types/           # Domain types and enums
│   └── exceptions/      # Domain exceptions
│
├── application/         # Use cases and orchestration
│   ├── commands/        # Write operations
│   ├── queries/         # Read operations
│   └── services/        # Application services
│
├── adapters/            # External interface implementations
│   ├── inbound/         # Entry points (HTTP, CLI)
│   └── outbound/        # Infrastructure (DB, payments)
│
└── infrastructure/      # Cross-cutting concerns
    ├── config/          # Configuration
    ├── logging/         # Logging
    └── di/              # Dependency injection
```

## 🎯 Next Steps

### Option 1: Follow the Guided Path
Read [NEXT_STEPS.md](NEXT_STEPS.md) for a detailed phase-by-phase implementation guide.

**Recommended order**:
1. Start with value objects (Money, DateRange)
2. Build domain entities (Equipment, Rental, Member)
3. Define ports (repository interfaces)
4. Create in-memory adapters for testing
5. Implement use cases (commands and queries)
6. Add real adapters (database, HTTP)
7. Wire everything together with DI

### Option 2: Start with a Vertical Slice
Pick one feature and implement it end-to-end:

**Example: Simple Rental Creation**
1. Create value objects: `Money`, `DateRange`, `RentalId`
2. Create entities: `Equipment`, `Member`, `Rental`
3. Define ports: `EquipmentRepository`, `MemberRepository`, `RentalRepository`
4. Implement: `CreateRentalCommand`
5. Create: `InMemoryEquipmentRepository` (for testing)
6. Write tests for the full flow
7. Add HTTP endpoint: `POST /rentals`

### Option 3: Explore the Documentation
- [README.md](README.md) - Project overview
- [ARCHITECTURE.md](ARCHITECTURE.md) - Architecture deep dive
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Detailed structure reference
- [NEXT_STEPS.md](NEXT_STEPS.md) - Implementation roadmap

## 📝 Example: Creating Your First Value Object

Let's create the `Money` value object as a starting point:

### 1. Create the file
```bash
touch src/domain/value-objects/Money.ts
```

### 2. Implement the value object
```typescript
// src/domain/value-objects/Money.ts

export class Money {
  private constructor(public readonly amount: number) {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
  }

  static zero(): Money {
    return new Money(0);
  }

  static dollars(amount: number): Money {
    return new Money(amount);
  }

  add(other: Money): Money {
    return new Money(this.amount + other.amount);
  }

  subtract(other: Money): Money {
    return new Money(this.amount - other.amount);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor);
  }

  isGreaterThan(other: Money): boolean {
    return this.amount > other.amount;
  }

  isLessThan(other: Money): boolean {
    return this.amount < other.amount;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount;
  }
}
```

### 3. Create a test
```bash
mkdir -p src/domain/value-objects/__tests__
touch src/domain/value-objects/__tests__/Money.test.ts
```

```typescript
// src/domain/value-objects/__tests__/Money.test.ts

import { Money } from '../Money';

describe('Money', () => {
  describe('creation', () => {
    it('should create money with positive amount', () => {
      const money = Money.dollars(100);
      expect(money.amount).toBe(100);
    });

    it('should create zero money', () => {
      const money = Money.zero();
      expect(money.amount).toBe(0);
    });

    it('should throw error for negative amount', () => {
      expect(() => Money.dollars(-10)).toThrow('Money amount cannot be negative');
    });
  });

  describe('arithmetic', () => {
    it('should add two money amounts', () => {
      const money1 = Money.dollars(50);
      const money2 = Money.dollars(30);
      const result = money1.add(money2);

      expect(result.amount).toBe(80);
    });

    it('should subtract money amounts', () => {
      const money1 = Money.dollars(100);
      const money2 = Money.dollars(30);
      const result = money1.subtract(money2);

      expect(result.amount).toBe(70);
    });

    it('should multiply money by factor', () => {
      const money = Money.dollars(50);
      const result = money.multiply(2.5);

      expect(result.amount).toBe(125);
    });
  });

  describe('comparison', () => {
    it('should compare two money amounts for equality', () => {
      const money1 = Money.dollars(100);
      const money2 = Money.dollars(100);

      expect(money1.equals(money2)).toBe(true);
    });

    it('should check if money is greater than', () => {
      const money1 = Money.dollars(100);
      const money2 = Money.dollars(50);

      expect(money1.isGreaterThan(money2)).toBe(true);
      expect(money2.isGreaterThan(money1)).toBe(false);
    });
  });
});
```

### 4. Run the test
```bash
npm test
```

You should see all tests passing!

## 🧪 Testing Strategy

### Domain Layer Tests
- **Pure unit tests** - No mocks, no infrastructure
- Test business rules and logic
- Fast and reliable

Example:
```typescript
describe('Rental', () => {
  it('should calculate late fee based on days late', () => {
    const rental = createTestRental();
    const lateFee = rental.calculateLateFee(threeDaysLate);
    expect(lateFee.amount).toBe(40);
  });
});
```

### Application Layer Tests
- **Integration tests** with in-memory adapters
- Test use case orchestration
- Verify side effects

Example:
```typescript
describe('CreateRentalCommandHandler', () => {
  it('should create rental and charge deposit', async () => {
    const repos = createInMemoryRepositories();
    const handler = new CreateRentalCommandHandler(repos);

    const rentalId = await handler.execute(command);

    expect(rentalId).toBeDefined();
    expect(mockPaymentService.charges).toHaveLength(1);
  });
});
```

### Adapter Tests
- Test infrastructure implementations
- Can use real databases or comprehensive mocks

Example:
```typescript
describe('PrismaRentalRepository', () => {
  it('should persist and retrieve rental', async () => {
    const repo = new PrismaRentalRepository(prisma);
    await repo.save(rental);

    const retrieved = await repo.findById(rental.id);
    expect(retrieved).toEqual(rental);
  });
});
```

## 🔧 Development Tips

### 1. Use Path Aliases
Instead of:
```typescript
import { Money } from '../../../domain/value-objects/Money';
```

Use:
```typescript
import { Money } from '@domain/value-objects/Money';
```

### 2. Keep Domain Pure
Domain layer should have ZERO dependencies on:
- Frameworks (Express, NestJS)
- Databases (Prisma, TypeORM)
- External libraries (except standard TypeScript)

### 3. Test First
Write tests before implementation, especially for domain logic:
1. Write failing test
2. Implement minimum code to pass
3. Refactor
4. Repeat

### 4. Small Commits
Commit after each completed component:
```bash
git add src/domain/value-objects/Money.ts
git commit -m "Add Money value object with tests"
```

### 5. Vertical Slices
Implement features end-to-end (domain → application → adapter) before moving to the next feature.

## 🎓 Learning Resources

### Hexagonal Architecture
- [Alistair Cockburn - Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Netflix Tech Blog - Hexagonal Architecture](https://netflixtechblog.com/ready-for-changes-with-hexagonal-architecture-b315ec967749)

### Domain-Driven Design
- [Eric Evans - DDD Reference](https://www.domainlanguage.com/ddd/reference/)
- [Martin Fowler - Domain-Driven Design](https://martinfowler.com/tags/domain%20driven%20design.html)

### TypeScript & Node.js
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 🐛 Troubleshooting

### TypeScript Compilation Errors
```bash
npm run typecheck
```

### Linting Errors
```bash
npm run lint:fix
```

### Format Issues
```bash
npm run format
```

### Clean Build
```bash
npm run clean && npm run build
```

## 🚀 Ready to Start!

You're all set! Choose your path:

1. **Follow the guide**: Open [NEXT_STEPS.md](NEXT_STEPS.md)
2. **Learn the architecture**: Read [ARCHITECTURE.md](ARCHITECTURE.md)
3. **Start coding**: Create your first value object (see example above)

Happy coding! 🎉

## 📞 Need Help?

Refer to the documentation:
- Architecture questions → [ARCHITECTURE.md](ARCHITECTURE.md)
- Structure questions → [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- What to build next → [NEXT_STEPS.md](NEXT_STEPS.md)
