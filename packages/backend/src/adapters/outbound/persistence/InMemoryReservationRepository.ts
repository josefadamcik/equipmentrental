import { Reservation, ReservationStatus } from '../../../domain/entities/Reservation.js';
import { ReservationId, MemberId, EquipmentId } from '../../../domain/value-objects/identifiers.js';
import { DateRange } from '../../../domain/value-objects/DateRange.js';
import { ReservationRepository } from '../../../domain/ports/ReservationRepository.js';

/**
 * In-memory implementation of ReservationRepository for testing
 * Stores reservations in memory using a Map for fast lookups
 */
export class InMemoryReservationRepository implements ReservationRepository {
  private reservations: Map<string, Reservation> = new Map();

  async findById(id: ReservationId): Promise<Reservation | undefined> {
    const reservation = this.reservations.get(id.value);
    return reservation ? this.clone(reservation) : undefined;
  }

  async findAll(): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).map((r) => this.clone(r));
  }

  async findByMemberId(memberId: MemberId): Promise<Reservation[]> {
    return Array.from(this.reservations.values())
      .filter((r) => r.memberId.value === memberId.value)
      .map((r) => this.clone(r));
  }

  async findByEquipmentId(equipmentId: EquipmentId): Promise<Reservation[]> {
    return Array.from(this.reservations.values())
      .filter((r) => r.equipmentId.value === equipmentId.value)
      .map((r) => this.clone(r));
  }

  async findByStatus(status: ReservationStatus): Promise<Reservation[]> {
    return Array.from(this.reservations.values())
      .filter((r) => r.status === status)
      .map((r) => this.clone(r));
  }

  async findActive(now: Date = new Date()): Promise<Reservation[]> {
    return Array.from(this.reservations.values())
      .filter((r) => r.isActive(now))
      .map((r) => this.clone(r));
  }

  async findActiveByMemberId(memberId: MemberId, now: Date = new Date()): Promise<Reservation[]> {
    return Array.from(this.reservations.values())
      .filter((r) => r.memberId.value === memberId.value && r.isActive(now))
      .map((r) => this.clone(r));
  }

  async findActiveByEquipmentId(
    equipmentId: EquipmentId,
    now: Date = new Date(),
  ): Promise<Reservation[]> {
    return Array.from(this.reservations.values())
      .filter((r) => r.equipmentId.value === equipmentId.value && r.isActive(now))
      .map((r) => this.clone(r));
  }

  async findConflicting(equipmentId: EquipmentId, period: DateRange): Promise<Reservation[]> {
    return Array.from(this.reservations.values())
      .filter(
        (r) =>
          r.equipmentId.value === equipmentId.value &&
          (r.status === ReservationStatus.PENDING || r.status === ReservationStatus.CONFIRMED) &&
          r.overlaps(period),
      )
      .map((r) => this.clone(r));
  }

  async findReadyToFulfill(now: Date = new Date()): Promise<Reservation[]> {
    return Array.from(this.reservations.values())
      .filter((r) => r.isReadyToFulfill(now))
      .map((r) => this.clone(r));
  }

  async findExpired(now: Date = new Date()): Promise<Reservation[]> {
    return Array.from(this.reservations.values())
      .filter(
        (r) =>
          (r.status === ReservationStatus.PENDING || r.status === ReservationStatus.CONFIRMED) &&
          r.period.hasEnded(now),
      )
      .map((r) => this.clone(r));
  }

  async findStartingInPeriod(period: DateRange): Promise<Reservation[]> {
    return Array.from(this.reservations.values())
      .filter((r) => {
        const startDate = r.period.start;
        return startDate >= period.start && startDate <= period.end;
      })
      .map((r) => this.clone(r));
  }

  async findByCreatedDateRange(startDate: Date, endDate: Date): Promise<Reservation[]> {
    return Array.from(this.reservations.values())
      .filter((r) => {
        const createdAt = r.createdAt.getTime();
        return createdAt >= startDate.getTime() && createdAt <= endDate.getTime();
      })
      .map((r) => this.clone(r));
  }

  async save(reservation: Reservation): Promise<void> {
    // Store a clone to avoid external mutations
    this.reservations.set(reservation.id.value, this.clone(reservation));
  }

  async delete(id: ReservationId): Promise<void> {
    this.reservations.delete(id.value);
  }

  async exists(id: ReservationId): Promise<boolean> {
    return this.reservations.has(id.value);
  }

  async count(): Promise<number> {
    return this.reservations.size;
  }

  async countByStatus(status: ReservationStatus): Promise<number> {
    return Array.from(this.reservations.values()).filter((r) => r.status === status).length;
  }

  async countActiveByMemberId(memberId: MemberId, now: Date = new Date()): Promise<number> {
    return Array.from(this.reservations.values()).filter(
      (r) => r.memberId.value === memberId.value && r.isActive(now),
    ).length;
  }

  /**
   * Clear all reservations from the repository
   * Useful for testing
   */
  clear(): void {
    this.reservations.clear();
  }

  /**
   * Clone a reservation entity to avoid reference issues
   */
  private clone(reservation: Reservation): Reservation {
    return Reservation.reconstitute(reservation.toSnapshot());
  }
}
