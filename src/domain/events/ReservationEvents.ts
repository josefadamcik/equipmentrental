import { DomainEvent } from './DomainEvent';
import { ReservationId } from '../value-objects/identifiers';
import { EquipmentId } from '../value-objects/identifiers';
import { MemberId } from '../value-objects/identifiers';
import { DateRange } from '../value-objects/DateRange';

/**
 * Event emitted when a new reservation is created
 */
export class ReservationCreated implements DomainEvent {
  readonly eventType = 'ReservationCreated';

  constructor(
    public readonly eventId: string,
    public readonly occurredAt: Date,
    public readonly aggregateId: string,
    public readonly reservationId: ReservationId,
    public readonly memberId: MemberId,
    public readonly equipmentId: EquipmentId,
    public readonly period: DateRange,
  ) {}

  static create(
    reservationId: ReservationId,
    memberId: MemberId,
    equipmentId: EquipmentId,
    period: DateRange,
  ): ReservationCreated {
    return new ReservationCreated(
      crypto.randomUUID(),
      new Date(),
      reservationId.value,
      reservationId,
      memberId,
      equipmentId,
      period,
    );
  }
}

/**
 * Event emitted when a reservation is cancelled
 */
export class ReservationCancelled implements DomainEvent {
  readonly eventType = 'ReservationCancelled';

  constructor(
    public readonly eventId: string,
    public readonly occurredAt: Date,
    public readonly aggregateId: string,
    public readonly reservationId: ReservationId,
    public readonly memberId: MemberId,
    public readonly reason?: string,
  ) {}

  static create(
    reservationId: ReservationId,
    memberId: MemberId,
    reason?: string,
  ): ReservationCancelled {
    return new ReservationCancelled(
      crypto.randomUUID(),
      new Date(),
      reservationId.value,
      reservationId,
      memberId,
      reason,
    );
  }
}
