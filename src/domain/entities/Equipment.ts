import { EquipmentId } from '../value-objects/identifiers.js';
import { Money } from '../value-objects/Money.js';
import { EquipmentCondition, isRentable } from '../types/EquipmentCondition.js';

export interface EquipmentProps {
  id: EquipmentId;
  name: string;
  description: string;
  category: string;
  dailyRate: Money;
  condition: EquipmentCondition;
  isAvailable: boolean;
  currentRentalId?: string;
  purchaseDate: Date;
  lastMaintenanceDate?: Date;
}

/**
 * Equipment entity representing rental items with availability tracking
 */
export class Equipment {
  private constructor(private props: EquipmentProps) {}

  static create(props: Omit<EquipmentProps, 'id' | 'isAvailable'>): Equipment {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Equipment name cannot be empty');
    }

    if (!props.category || props.category.trim().length === 0) {
      throw new Error('Equipment category cannot be empty');
    }

    if (props.dailyRate.amount <= 0) {
      throw new Error('Daily rate must be greater than zero');
    }

    return new Equipment({
      ...props,
      id: EquipmentId.generate(),
      isAvailable: isRentable(props.condition),
    });
  }

  static reconstitute(props: EquipmentProps): Equipment {
    return new Equipment(props);
  }

  // Getters
  get id(): EquipmentId {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get category(): string {
    return this.props.category;
  }

  get dailyRate(): Money {
    return this.props.dailyRate;
  }

  get condition(): EquipmentCondition {
    return this.props.condition;
  }

  get isAvailable(): boolean {
    return this.props.isAvailable;
  }

  get currentRentalId(): string | undefined {
    return this.props.currentRentalId;
  }

  get purchaseDate(): Date {
    return this.props.purchaseDate;
  }

  get lastMaintenanceDate(): Date | undefined {
    return this.props.lastMaintenanceDate;
  }

  /**
   * Mark equipment as rented
   */
  markAsRented(rentalId: string): void {
    if (!this.props.isAvailable) {
      throw new Error('Equipment is not available for rental');
    }

    if (!isRentable(this.props.condition)) {
      throw new Error('Equipment condition does not allow rental');
    }

    this.props.isAvailable = false;
    this.props.currentRentalId = rentalId;
  }

  /**
   * Mark equipment as returned and update condition
   */
  markAsReturned(newCondition: EquipmentCondition): void {
    if (this.props.isAvailable) {
      throw new Error('Equipment is not currently rented');
    }

    this.props.condition = newCondition;
    this.props.isAvailable = isRentable(newCondition);
    this.props.currentRentalId = undefined;
  }

  /**
   * Update equipment condition
   */
  updateCondition(newCondition: EquipmentCondition): void {
    this.props.condition = newCondition;

    // If equipment becomes unrentable, mark as unavailable
    if (!isRentable(newCondition)) {
      this.props.isAvailable = false;
    }
  }

  /**
   * Record maintenance performed on equipment
   */
  recordMaintenance(date: Date = new Date()): void {
    this.props.lastMaintenanceDate = date;
  }

  /**
   * Update daily rental rate
   */
  updateDailyRate(newRate: Money): void {
    if (newRate.amount <= 0) {
      throw new Error('Daily rate must be greater than zero');
    }
    this.props.dailyRate = newRate;
  }

  /**
   * Check if equipment needs maintenance (no maintenance in last 90 days)
   */
  needsMaintenance(now: Date = new Date()): boolean {
    if (!this.props.lastMaintenanceDate) {
      const daysSincePurchase =
        (now.getTime() - this.props.purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSincePurchase > 90;
    }

    const daysSinceMaintenance =
      (now.getTime() - this.props.lastMaintenanceDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceMaintenance > 90;
  }

  /**
   * Calculate rental cost for a given number of days
   */
  calculateRentalCost(days: number): Money {
    if (days <= 0) {
      throw new Error('Number of days must be positive');
    }
    return this.props.dailyRate.multiply(days);
  }

  /**
   * Get equipment snapshot for persistence
   */
  toSnapshot(): EquipmentProps {
    return { ...this.props };
  }
}
