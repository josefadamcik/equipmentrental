import { RentalId, EquipmentId, MemberId } from '../value-objects/identifiers.js';
import { Money } from '../value-objects/Money.js';
import { DateRange } from '../value-objects/DateRange.js';
import { RentalStatus } from '../types/RentalStatus.js';
import { EquipmentCondition } from '../types/EquipmentCondition.js';

export interface RentalProps {
  id: RentalId;
  equipmentId: EquipmentId;
  memberId: MemberId;
  period: DateRange;
  status: RentalStatus;
  baseCost: Money;
  totalCost: Money;
  lateFee: Money;
  createdAt: Date;
  returnedAt?: Date;
  conditionAtStart: EquipmentCondition;
  conditionAtReturn?: EquipmentCondition;
}

/**
 * Rental aggregate managing the rental lifecycle
 * This is the central aggregate root for the rental domain
 */
export class Rental {
  private constructor(private props: RentalProps) {}

  static create(props: {
    equipmentId: EquipmentId;
    memberId: MemberId;
    period: DateRange;
    baseCost: Money;
    conditionAtStart: EquipmentCondition;
  }): Rental {
    if (props.baseCost.amount <= 0) {
      throw new Error('Rental base cost must be greater than zero');
    }

    return new Rental({
      id: RentalId.generate(),
      equipmentId: props.equipmentId,
      memberId: props.memberId,
      period: props.period,
      status: RentalStatus.ACTIVE,
      baseCost: props.baseCost,
      totalCost: props.baseCost,
      lateFee: Money.zero(),
      createdAt: new Date(),
      conditionAtStart: props.conditionAtStart,
    });
  }

  static reconstitute(props: RentalProps): Rental {
    return new Rental(props);
  }

  // Getters
  get id(): RentalId {
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

  get status(): RentalStatus {
    return this.props.status;
  }

  get baseCost(): Money {
    return this.props.baseCost;
  }

  get totalCost(): Money {
    return this.props.totalCost;
  }

  get lateFee(): Money {
    return this.props.lateFee;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get returnedAt(): Date | undefined {
    return this.props.returnedAt;
  }

  get conditionAtStart(): EquipmentCondition {
    return this.props.conditionAtStart;
  }

  get conditionAtReturn(): EquipmentCondition | undefined {
    return this.props.conditionAtReturn;
  }

  /**
   * Check if rental is currently overdue
   */
  isOverdue(now: Date = new Date()): boolean {
    return this.props.status === RentalStatus.ACTIVE && this.props.period.hasEnded(now);
  }

  /**
   * Mark rental as overdue and calculate late fees
   */
  markAsOverdue(dailyLateFeeRate: Money, now: Date = new Date()): void {
    if (this.props.status !== RentalStatus.ACTIVE) {
      throw new Error('Only active rentals can be marked as overdue');
    }

    if (!this.props.period.hasEnded(now)) {
      throw new Error('Rental period has not ended yet');
    }

    const daysOverdue = Math.abs(this.props.period.getDaysUntilEnd(now));
    this.props.lateFee = dailyLateFeeRate.multiply(daysOverdue);
    this.props.totalCost = this.props.baseCost.add(this.props.lateFee);
    this.props.status = RentalStatus.OVERDUE;
  }

  /**
   * Return the rental
   */
  returnRental(
    conditionAtReturn: EquipmentCondition,
    damageFee: Money = Money.zero(),
    now: Date = new Date(),
  ): void {
    if (this.props.status !== RentalStatus.ACTIVE && this.props.status !== RentalStatus.OVERDUE) {
      throw new Error('Only active or overdue rentals can be returned');
    }

    // If returning late, calculate late fees
    if (this.props.status === RentalStatus.ACTIVE && this.props.period.hasEnded(now)) {
      const daysOverdue = Math.abs(this.props.period.getDaysUntilEnd(now));
      // Default late fee rate of $10/day if not already calculated
      const dailyLateFeeRate = Money.dollars(10);
      this.props.lateFee = dailyLateFeeRate.multiply(daysOverdue);
    }

    // Add damage fee if applicable
    this.props.totalCost = this.props.baseCost.add(this.props.lateFee).add(damageFee);
    this.props.conditionAtReturn = conditionAtReturn;
    this.props.returnedAt = now;
    this.props.status = RentalStatus.RETURNED;
  }

  /**
   * Extend the rental period
   */
  extendPeriod(additionalDays: number, additionalCost: Money): void {
    if (this.props.status !== RentalStatus.ACTIVE && this.props.status !== RentalStatus.OVERDUE) {
      throw new Error('Only active or overdue rentals can be extended');
    }

    if (additionalDays <= 0) {
      throw new Error('Extension days must be positive');
    }

    if (additionalCost.amount < 0) {
      throw new Error('Additional cost cannot be negative');
    }

    this.props.period = this.props.period.extendBy(additionalDays);
    this.props.baseCost = this.props.baseCost.add(additionalCost);
    this.props.totalCost = this.props.baseCost.add(this.props.lateFee);

    // If was overdue, revert to active since we extended the period
    if (this.props.status === RentalStatus.OVERDUE) {
      this.props.status = RentalStatus.ACTIVE;
      this.props.lateFee = Money.zero();
      this.props.totalCost = this.props.baseCost;
    }
  }

  /**
   * Cancel the rental (can only cancel if not yet started or returned)
   */
  cancel(): void {
    if (
      this.props.status === RentalStatus.RETURNED ||
      this.props.status === RentalStatus.CANCELLED
    ) {
      throw new Error('Cannot cancel a completed rental');
    }

    this.props.status = RentalStatus.CANCELLED;
    this.props.totalCost = Money.zero(); // No charge for cancelled rentals
  }

  /**
   * Get the number of days in the rental period
   */
  getDurationDays(): number {
    return this.props.period.getDays();
  }

  /**
   * Calculate damage fee based on condition degradation
   */
  calculateDamageFee(conditionAtReturn: EquipmentCondition): Money {
    // Simple damage fee calculation based on condition degradation
    // In a real system, this might be more sophisticated
    const conditionOrder = [
      EquipmentCondition.EXCELLENT,
      EquipmentCondition.GOOD,
      EquipmentCondition.FAIR,
      EquipmentCondition.POOR,
      EquipmentCondition.DAMAGED,
      EquipmentCondition.UNDER_REPAIR,
    ];

    const startIndex = conditionOrder.indexOf(this.props.conditionAtStart);
    const returnIndex = conditionOrder.indexOf(conditionAtReturn);

    if (returnIndex <= startIndex || startIndex === -1 || returnIndex === -1) {
      return Money.zero(); // No degradation or invalid condition
    }

    const degradationLevels = returnIndex - startIndex;

    // Allow one level of degradation as acceptable wear and tear (e.g., EXCELLENT -> GOOD)
    if (degradationLevels <= 1) {
      return Money.zero();
    }

    // Charge $50 per degradation level beyond acceptable wear
    return Money.dollars(50 * (degradationLevels - 1));
  }

  /**
   * Get rental snapshot for persistence
   */
  toSnapshot(): RentalProps {
    return { ...this.props };
  }
}
