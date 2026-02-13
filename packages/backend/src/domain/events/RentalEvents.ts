import { DomainEvent } from './DomainEvent';
import { RentalId } from '../value-objects/identifiers';
import { EquipmentId } from '../value-objects/identifiers';
import { MemberId } from '../value-objects/identifiers';
import { Money } from '../value-objects/Money';
import { DateRange } from '../value-objects/DateRange';

/**
 * Event emitted when a new rental is created
 */
export class RentalCreated implements DomainEvent {
  readonly eventType = 'RentalCreated';

  constructor(
    public readonly eventId: string,
    public readonly occurredAt: Date,
    public readonly aggregateId: string,
    public readonly rentalId: RentalId,
    public readonly memberId: MemberId,
    public readonly equipmentId: EquipmentId,
    public readonly period: DateRange,
    public readonly dailyRate: Money,
  ) {}

  static create(
    rentalId: RentalId,
    memberId: MemberId,
    equipmentId: EquipmentId,
    period: DateRange,
    dailyRate: Money,
  ): RentalCreated {
    return new RentalCreated(
      crypto.randomUUID(),
      new Date(),
      rentalId.value,
      rentalId,
      memberId,
      equipmentId,
      period,
      dailyRate,
    );
  }
}

/**
 * Event emitted when a rental is returned
 */
export class RentalReturned implements DomainEvent {
  readonly eventType = 'RentalReturned';

  constructor(
    public readonly eventId: string,
    public readonly occurredAt: Date,
    public readonly aggregateId: string,
    public readonly rentalId: RentalId,
    public readonly returnedAt: Date,
    public readonly lateFees: Money,
    public readonly totalCost: Money,
  ) {}

  static create(
    rentalId: RentalId,
    returnedAt: Date,
    lateFees: Money,
    totalCost: Money,
  ): RentalReturned {
    return new RentalReturned(
      crypto.randomUUID(),
      new Date(),
      rentalId.value,
      rentalId,
      returnedAt,
      lateFees,
      totalCost,
    );
  }
}

/**
 * Event emitted when a rental becomes overdue
 */
export class RentalOverdue implements DomainEvent {
  readonly eventType = 'RentalOverdue';

  constructor(
    public readonly eventId: string,
    public readonly occurredAt: Date,
    public readonly aggregateId: string,
    public readonly rentalId: RentalId,
    public readonly memberId: MemberId,
    public readonly equipmentId: EquipmentId,
    public readonly daysOverdue: number,
    public readonly accruedLateFees: Money,
  ) {}

  static create(
    rentalId: RentalId,
    memberId: MemberId,
    equipmentId: EquipmentId,
    daysOverdue: number,
    accruedLateFees: Money,
  ): RentalOverdue {
    return new RentalOverdue(
      crypto.randomUUID(),
      new Date(),
      rentalId.value,
      rentalId,
      memberId,
      equipmentId,
      daysOverdue,
      accruedLateFees,
    );
  }
}
