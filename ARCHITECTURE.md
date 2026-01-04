# Architecture Documentation

## Hexagonal Architecture Overview

Hexagonal Architecture, also known as Ports and Adapters, is an architectural pattern that creates loosely coupled application components that can be connected to their software environment through ports and adapters. This approach isolates the core business logic from external concerns.

## Core Principles

### 1. Domain at the Center

The domain layer contains all business logic and is completely independent of:
- Frameworks
- Databases
- UI
- External services
- Delivery mechanisms

### 2. Ports Define Contracts

**Ports** are interfaces that define how the application interacts with the outside world:

- **Inbound Ports** (Primary/Driving): Define what the application can do (use cases)
- **Outbound Ports** (Secondary/Driven): Define what the application needs (dependencies)

### 3. Adapters Implement Contracts

**Adapters** are concrete implementations of ports:

- **Inbound Adapters**: HTTP controllers, CLI, message consumers
- **Outbound Adapters**: Database repositories, payment gateways, email services

## Layer Responsibilities

### Domain Layer (`src/domain/`)

**Purpose**: Contains pure business logic with zero external dependencies

**Components**:
- **Entities**: Core business objects with identity (Equipment, Rental, Member)
- **Value Objects**: Immutable objects defined by their values (Money, DateRange)
- **Domain Events**: Events that represent business occurrences
- **Ports**: Interface definitions for external dependencies
- **Exceptions**: Domain-specific error types

**Rules**:
- ✅ Can reference other domain components
- ❌ Cannot import from application, adapters, or infrastructure layers
- ❌ Cannot use frameworks or libraries (except standard TypeScript)
- ✅ Should be 100% unit testable without mocks

**Example**:
```typescript
// domain/entities/Rental.ts
export class Rental {
  private constructor(
    public readonly id: RentalId,
    private equipment: Equipment,
    private member: Member,
    private period: DateRange,
    private status: RentalStatus
  ) {}

  static create(
    equipment: Equipment,
    member: Member,
    period: DateRange
  ): Rental {
    // Business rule: verify member can rent
    const validation = member.canRent(equipment);
    if (!validation.isValid) {
      throw new RentalNotAllowedError(validation.reason);
    }

    // Business rule: equipment must be available
    if (!equipment.isAvailableForPeriod(period)) {
      throw new EquipmentNotAvailableError();
    }

    return new Rental(
      RentalId.generate(),
      equipment,
      member,
      period,
      RentalStatus.Active
    );
  }

  markReturned(returnDate: Date, condition: EquipmentCondition): RentalResult {
    // Business rule: can only return active or overdue rentals
    if (!this.canBeReturned()) {
      throw new InvalidStateTransitionError();
    }

    const lateFee = this.calculateLateFee(returnDate);
    const damageCharge = this.assessDamageCharge(condition);

    this.status = RentalStatus.Returned;

    return new RentalResult(lateFee, damageCharge);
  }

  private calculateLateFee(returnDate: Date): Money {
    // Pure business logic
    if (returnDate <= this.period.endDate) {
      return Money.zero();
    }

    const daysLate = this.period.daysAfter(returnDate);
    return this.member.tier.calculateLateFee(daysLate, this.equipment);
  }
}
```

### Application Layer (`src/application/`)

**Purpose**: Orchestrates domain logic to implement use cases

**Components**:
- **Commands**: Write operations that change state (CreateRentalCommand)
- **Queries**: Read operations that fetch data (GetAvailableEquipmentQuery)
- **Services**: Orchestrate multiple use cases or cross-cutting concerns

**Rules**:
- ✅ Can import from domain layer
- ❌ Cannot import from adapters or infrastructure
- ✅ Depends on ports (interfaces), not implementations
- ✅ Coordinates transactions and workflows
- ✅ Testable with in-memory adapters

**Example**:
```typescript
// application/commands/CreateRentalCommand.ts
export class CreateRentalCommandHandler {
  constructor(
    private equipmentRepo: EquipmentRepository,      // Port
    private memberRepo: MemberRepository,            // Port
    private rentalRepo: RentalRepository,            // Port
    private paymentService: PaymentService,          // Port
    private eventPublisher: EventPublisher           // Port
  ) {}

  async execute(command: CreateRentalCommand): Promise<RentalId> {
    // 1. Fetch aggregates
    const equipment = await this.equipmentRepo.findById(command.equipmentId);
    const member = await this.memberRepo.findById(command.memberId);

    if (!equipment) throw new EquipmentNotFoundError();
    if (!member) throw new MemberNotFoundError();

    // 2. Execute domain logic
    const period = new DateRange(command.startDate, command.endDate);
    const depositAmount = member.calculateDepositAmount(equipment);

    // 3. Handle side effects through ports
    const paymentRef = await this.paymentService.chargeDeposit(
      member.id,
      depositAmount
    );

    // 4. Create domain entity
    const rental = Rental.create(equipment, member, period);

    // 5. Persist
    await this.rentalRepo.save(rental);

    // 6. Publish domain events
    await this.eventPublisher.publish(new RentalCreated(rental));

    return rental.id;
  }
}
```

### Adapters Layer (`src/adapters/`)

**Purpose**: Implement ports to connect the application to external systems

#### Inbound Adapters (`src/adapters/inbound/`)

Convert external requests into application commands/queries:

```typescript
// adapters/inbound/http/controllers/RentalController.ts
export class RentalController {
  constructor(
    private createRentalHandler: CreateRentalCommandHandler,
    private getRentalQuery: GetRentalQueryHandler
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    // Convert HTTP request to domain command
    const command = new CreateRentalCommand({
      memberId: new MemberId(req.body.memberId),
      equipmentId: new EquipmentId(req.body.equipmentId),
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate)
    });

    // Execute use case
    const rentalId = await this.createRentalHandler.execute(command);

    // Convert domain response to HTTP response
    res.status(201).json({ id: rentalId.value });
  }
}
```

#### Outbound Adapters (`src/adapters/outbound/`)

Implement port interfaces to interact with infrastructure:

```typescript
// adapters/outbound/persistence/PrismaRentalRepository.ts
export class PrismaRentalRepository implements RentalRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: RentalId): Promise<Rental | null> {
    const record = await this.prisma.rental.findUnique({
      where: { id: id.value },
      include: { equipment: true, member: true }
    });

    return record ? this.toDomain(record) : null;
  }

  async save(rental: Rental): Promise<void> {
    const data = this.toData(rental);
    await this.prisma.rental.upsert({
      where: { id: data.id },
      update: data,
      create: data
    });
  }

  private toDomain(record: PrismaRental): Rental {
    // Map database model to domain entity
    return new Rental(
      new RentalId(record.id),
      // ... other mappings
    );
  }

  private toData(rental: Rental): PrismaRentalData {
    // Map domain entity to database model
    return {
      id: rental.id.value,
      // ... other mappings
    };
  }
}
```

### Infrastructure Layer (`src/infrastructure/`)

**Purpose**: Provide cross-cutting concerns and wire everything together

**Components**:
- **Dependency Injection**: Container that assembles the application
- **Configuration**: Environment-specific settings
- **Logging**: Centralized logging setup

```typescript
// infrastructure/di/container.ts
export class Container {
  private static instance: Container;
  private services: Map<string, any> = new Map();

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  register(): void {
    // Register adapters
    const prisma = new PrismaClient();
    const equipmentRepo = new PrismaEquipmentRepository(prisma);
    const memberRepo = new PrismaMemberRepository(prisma);
    const rentalRepo = new PrismaRentalRepository(prisma);
    const paymentService = new StripePaymentService();
    const eventPublisher = new InMemoryEventPublisher();

    // Register use cases
    const createRentalHandler = new CreateRentalCommandHandler(
      equipmentRepo,
      memberRepo,
      rentalRepo,
      paymentService,
      eventPublisher
    );

    // Store in container
    this.services.set('CreateRentalCommandHandler', createRentalHandler);
  }

  get<T>(key: string): T {
    return this.services.get(key);
  }
}
```

## Benefits

### 1. Testability
- Domain logic tested without infrastructure
- Use cases tested with in-memory adapters
- Easy to mock external dependencies

### 2. Flexibility
- Swap implementations without changing business logic
- Multiple adapters for same port (e.g., Stripe + PayPal)
- Easy to add new delivery mechanisms (REST, GraphQL, gRPC)

### 3. Maintainability
- Clear separation of concerns
- Business logic isolated and protected
- Changes in frameworks don't affect domain

### 4. Domain Focus
- Business rules are explicit and central
- Ubiquitous language in code
- Domain experts can read the code

## Testing Strategy

### Domain Layer Tests
```typescript
describe('Rental', () => {
  it('should calculate late fee based on member tier', () => {
    const member = Member.create(MembershipTier.Basic);
    const equipment = Equipment.create(Money.dollars(100));
    const period = DateRange.create(today, tomorrow);

    const rental = Rental.create(equipment, member, period);
    const lateFee = rental.calculateLateFee(threeDaysLater);

    expect(lateFee.amount).toBe(40); // $10 first day + $15 * 2
  });
});
```

### Application Layer Tests
```typescript
describe('CreateRentalCommandHandler', () => {
  it('should create rental and charge deposit', async () => {
    const equipmentRepo = new InMemoryEquipmentRepository();
    const memberRepo = new InMemoryMemberRepository();
    const rentalRepo = new InMemoryRentalRepository();
    const paymentService = new MockPaymentService();

    const handler = new CreateRentalCommandHandler(
      equipmentRepo,
      memberRepo,
      rentalRepo,
      paymentService,
      new InMemoryEventPublisher()
    );

    const rentalId = await handler.execute(command);

    expect(rentalId).toBeDefined();
    expect(paymentService.charges).toHaveLength(1);
  });
});
```

### Adapter Tests
```typescript
describe('PrismaRentalRepository', () => {
  it('should persist and retrieve rental', async () => {
    const repo = new PrismaRentalRepository(prisma);
    const rental = createTestRental();

    await repo.save(rental);
    const retrieved = await repo.findById(rental.id);

    expect(retrieved).toEqual(rental);
  });
});
```

## Common Patterns

### Value Objects
Immutable objects that encapsulate validation and behavior:

```typescript
export class Money {
  private constructor(public readonly amount: number) {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
  }

  static dollars(amount: number): Money {
    return new Money(amount);
  }

  add(other: Money): Money {
    return new Money(this.amount + other.amount);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor);
  }
}
```

### Domain Events
Communicate state changes across boundaries:

```typescript
export class RentalCreated implements DomainEvent {
  readonly occurredAt: Date;

  constructor(
    public readonly rentalId: RentalId,
    public readonly memberId: MemberId,
    public readonly equipmentId: EquipmentId
  ) {
    this.occurredAt = new Date();
  }
}
```

### Repository Pattern
Abstract data access:

```typescript
export interface RentalRepository {
  findById(id: RentalId): Promise<Rental | null>;
  findByMember(memberId: MemberId): Promise<Rental[]>;
  findOverdue(): Promise<Rental[]>;
  save(rental: Rental): Promise<void>;
}
```

## Decision Records

### Why Hexagonal Architecture?

**Decision**: Use hexagonal architecture for this project

**Context**: Need to demonstrate clean separation between business logic and infrastructure

**Consequences**:
- ✅ Business logic is framework-agnostic and highly testable
- ✅ Easy to swap infrastructure (databases, payment providers)
- ✅ Clear boundaries make the system easier to understand
- ⚠️  More upfront design and structure needed
- ⚠️  May feel like over-engineering for simple CRUD operations

### Why TypeScript?

**Decision**: Use TypeScript instead of JavaScript

**Context**: Need strong typing to enforce architectural boundaries

**Consequences**:
- ✅ Compile-time type checking prevents architectural violations
- ✅ Better IDE support and refactoring
- ✅ Self-documenting code through types
- ⚠️  Additional build step required
