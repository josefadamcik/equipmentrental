import { ReservationId, EquipmentId, MemberId } from '../value-objects/identifiers.js';
import { DateRange } from '../value-objects/DateRange.js';
import { InvalidReservationStateError } from '../exceptions/ReservationExceptions.js';

export const ReservationStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  FULFILLED: 'FULFILLED',
  EXPIRED: 'EXPIRED',
} as const;

export type ReservationStatus = (typeof ReservationStatus)[keyof typeof ReservationStatus];

export interface ReservationProps {
  id: ReservationId;
  equipmentId: EquipmentId;
  memberId: MemberId;
  period: DateRange;
  status: ReservationStatus;
  createdAt: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
  fulfilledAt?: Date;
}

/**
 * Reservation entity for future equipment bookings
 */
export class Reservation {
  private constructor(private props: ReservationProps) {}

  static create(props: {
    equipmentId: EquipmentId;
    memberId: MemberId;
    period: DateRange;
  }): Reservation {
    const now = new Date();

    // Ensure reservation is for the future
    if (props.period.hasStarted(now)) {
      throw new InvalidReservationStateError('new', 'PENDING', 'Reservation period must be in the future');
    }

    return new Reservation({
      id: ReservationId.generate(),
      equipmentId: props.equipmentId,
      memberId: props.memberId,
      period: props.period,
      status: ReservationStatus.PENDING,
      createdAt: now,
    });
  }

  static reconstitute(props: ReservationProps): Reservation {
    return new Reservation(props);
  }

  // Getters
  get id(): ReservationId {
    return this.props.id;
  }

  get equipmentId(): EquipmentId {
    return this.props.equipmentId;
  }

  get memberId(): MemberId {
    return this.props.memberId;
  }

  get period(): DateRange {
    return this.props.period;
  }

  get status(): ReservationStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get confirmedAt(): Date | undefined {
    return this.props.confirmedAt;
  }

  get cancelledAt(): Date | undefined {
    return this.props.cancelledAt;
  }

  get fulfilledAt(): Date | undefined {
    return this.props.fulfilledAt;
  }

  /**
   * Confirm the reservation
   */
  confirm(now: Date = new Date()): void {
    if (this.props.status !== ReservationStatus.PENDING) {
      throw new InvalidReservationStateError(
        this.props.id.value, this.props.status, 'Only pending reservations can be confirmed',
      );
    }

    if (this.props.period.hasStarted(now)) {
      throw new Error('Cannot confirm reservation that has already started');
    }

    this.props.status = ReservationStatus.CONFIRMED;
    this.props.confirmedAt = now;
  }

  /**
   * Cancel the reservation
   */
  cancel(now: Date = new Date()): void {
    if (
      this.props.status !== ReservationStatus.PENDING &&
      this.props.status !== ReservationStatus.CONFIRMED
    ) {
      throw new InvalidReservationStateError(
        this.props.id.value, this.props.status, 'Only pending or confirmed reservations can be cancelled',
      );
    }

    if (this.props.period.hasEnded(now)) {
      throw new Error('Cannot cancel expired reservation');
    }

    this.props.status = ReservationStatus.CANCELLED;
    this.props.cancelledAt = now;
  }

  /**
   * Mark reservation as fulfilled (when rental is created)
   */
  fulfill(now: Date = new Date()): void {
    if (this.props.status !== ReservationStatus.CONFIRMED) {
      throw new InvalidReservationStateError(
        this.props.id.value, this.props.status, 'Only confirmed reservations can be fulfilled',
      );
    }

    if (!this.props.period.hasStarted(now)) {
      throw new InvalidReservationStateError(
        this.props.id.value, this.props.status, 'Cannot fulfill reservation before start date',
      );
    }

    this.props.status = ReservationStatus.FULFILLED;
    this.props.fulfilledAt = now;
  }

  /**
   * Mark reservation as expired
   */
  markAsExpired(now: Date = new Date()): void {
    if (
      this.props.status !== ReservationStatus.PENDING &&
      this.props.status !== ReservationStatus.CONFIRMED
    ) {
      throw new Error('Only pending or confirmed reservations can expire');
    }

    if (!this.props.period.hasEnded(now)) {
      throw new Error('Reservation period has not ended yet');
    }

    this.props.status = ReservationStatus.EXPIRED;
  }

  /**
   * Check if reservation is active (pending or confirmed and not expired)
   */
  isActive(now: Date = new Date()): boolean {
    if (
      this.props.status !== ReservationStatus.PENDING &&
      this.props.status !== ReservationStatus.CONFIRMED
    ) {
      return false;
    }

    return !this.props.period.hasEnded(now);
  }

  /**
   * Check if reservation period overlaps with another date range
   */
  overlaps(other: DateRange): boolean {
    return this.props.period.overlaps(other);
  }

  /**
   * Check if reservation is ready to be fulfilled
   */
  isReadyToFulfill(now: Date = new Date()): boolean {
    return this.props.status === ReservationStatus.CONFIRMED && this.props.period.hasStarted(now);
  }

  /**
   * Get reservation snapshot for persistence
   */
  toSnapshot(): ReservationProps {
    return { ...this.props };
  }
}
