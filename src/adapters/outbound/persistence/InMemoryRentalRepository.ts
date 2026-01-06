import { Rental } from '../../../domain/entities/Rental.js';
import { RentalId, MemberId, EquipmentId } from '../../../domain/value-objects/identifiers.js';
import { RentalStatus } from '../../../domain/types/RentalStatus.js';
import { DateRange } from '../../../domain/value-objects/DateRange.js';
import { RentalRepository } from '../../../domain/ports/RentalRepository.js';

/**
 * In-memory implementation of RentalRepository for testing
 * Stores rentals in memory using a Map for fast lookups
 */
export class InMemoryRentalRepository implements RentalRepository {
  private rentals: Map<string, Rental> = new Map();

  async findById(id: RentalId): Promise<Rental | undefined> {
    const rental = this.rentals.get(id.value);
    return rental ? this.clone(rental) : undefined;
  }

  async findAll(): Promise<Rental[]> {
    return Array.from(this.rentals.values()).map((r) => this.clone(r));
  }

  async findByMemberId(memberId: MemberId): Promise<Rental[]> {
    return Array.from(this.rentals.values())
      .filter((r) => r.memberId.value === memberId.value)
      .map((r) => this.clone(r));
  }

  async findByEquipmentId(equipmentId: EquipmentId): Promise<Rental[]> {
    return Array.from(this.rentals.values())
      .filter((r) => r.equipmentId.value === equipmentId.value)
      .map((r) => this.clone(r));
  }

  async findByStatus(status: RentalStatus): Promise<Rental[]> {
    return Array.from(this.rentals.values())
      .filter((r) => r.status === status)
      .map((r) => this.clone(r));
  }

  async findActive(): Promise<Rental[]> {
    return Array.from(this.rentals.values())
      .filter((r) => r.status === RentalStatus.ACTIVE || r.status === RentalStatus.OVERDUE)
      .map((r) => this.clone(r));
  }

  async findActiveByMemberId(memberId: MemberId): Promise<Rental[]> {
    return Array.from(this.rentals.values())
      .filter(
        (r) =>
          r.memberId.value === memberId.value &&
          (r.status === RentalStatus.ACTIVE || r.status === RentalStatus.OVERDUE),
      )
      .map((r) => this.clone(r));
  }

  async findActiveByEquipmentId(equipmentId: EquipmentId): Promise<Rental | undefined> {
    const rental = Array.from(this.rentals.values()).find(
      (r) =>
        r.equipmentId.value === equipmentId.value &&
        (r.status === RentalStatus.ACTIVE || r.status === RentalStatus.OVERDUE),
    );
    return rental ? this.clone(rental) : undefined;
  }

  async findOverdue(now: Date = new Date()): Promise<Rental[]> {
    return Array.from(this.rentals.values())
      .filter((r) => r.isOverdue(now))
      .map((r) => this.clone(r));
  }

  async findEndingInPeriod(period: DateRange): Promise<Rental[]> {
    return Array.from(this.rentals.values())
      .filter((r) => {
        const rentalEndDate = r.period.end;
        return (
          rentalEndDate >= period.start &&
          rentalEndDate <= period.end &&
          (r.status === RentalStatus.ACTIVE || r.status === RentalStatus.OVERDUE)
        );
      })
      .map((r) => this.clone(r));
  }

  async findByCreatedDateRange(startDate: Date, endDate: Date): Promise<Rental[]> {
    return Array.from(this.rentals.values())
      .filter((r) => {
        const createdAt = r.createdAt.getTime();
        return createdAt >= startDate.getTime() && createdAt <= endDate.getTime();
      })
      .map((r) => this.clone(r));
  }

  async findByReturnedDateRange(startDate: Date, endDate: Date): Promise<Rental[]> {
    return Array.from(this.rentals.values())
      .filter((r) => {
        if (!r.returnedAt) {
          return false;
        }
        const returnedAt = r.returnedAt.getTime();
        return returnedAt >= startDate.getTime() && returnedAt <= endDate.getTime();
      })
      .map((r) => this.clone(r));
  }

  async save(rental: Rental): Promise<void> {
    // Store a clone to avoid external mutations
    this.rentals.set(rental.id.value, this.clone(rental));
  }

  async delete(id: RentalId): Promise<void> {
    this.rentals.delete(id.value);
  }

  async exists(id: RentalId): Promise<boolean> {
    return this.rentals.has(id.value);
  }

  async count(): Promise<number> {
    return this.rentals.size;
  }

  async countByStatus(status: RentalStatus): Promise<number> {
    return Array.from(this.rentals.values()).filter((r) => r.status === status).length;
  }

  async countActiveByMemberId(memberId: MemberId): Promise<number> {
    return Array.from(this.rentals.values()).filter(
      (r) =>
        r.memberId.value === memberId.value &&
        (r.status === RentalStatus.ACTIVE || r.status === RentalStatus.OVERDUE),
    ).length;
  }

  /**
   * Clear all rentals from the repository
   * Useful for testing
   */
  clear(): void {
    this.rentals.clear();
  }

  /**
   * Clone a rental entity to avoid reference issues
   */
  private clone(rental: Rental): Rental {
    return Rental.reconstitute(rental.toSnapshot());
  }
}
