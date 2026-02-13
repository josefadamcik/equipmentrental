import { MemberId } from '../value-objects/identifiers.js';
import {
  MembershipTier,
  getMaxConcurrentRentals,
  getMaxRentalDays,
  getDiscountPercentage,
} from '../types/MembershipTier.js';
import { Money } from '../value-objects/Money.js';

export interface MemberProps {
  id: MemberId;
  name: string;
  email: string;
  tier: MembershipTier;
  joinDate: Date;
  activeRentalCount: number;
  totalRentals: number;
  isActive: boolean;
}

/**
 * Member entity representing customers with tier-based rules
 */
export class Member {
  private constructor(private props: MemberProps) {}

  static create(props: Omit<MemberProps, 'id' | 'activeRentalCount' | 'totalRentals'>): Member {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Member name cannot be empty');
    }

    if (!props.email || !Member.isValidEmail(props.email)) {
      throw new Error('Invalid email address');
    }

    return new Member({
      ...props,
      id: MemberId.generate(),
      activeRentalCount: 0,
      totalRentals: 0,
    });
  }

  static reconstitute(props: MemberProps): Member {
    return new Member(props);
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Getters
  get id(): MemberId {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get tier(): MembershipTier {
    return this.props.tier;
  }

  get joinDate(): Date {
    return this.props.joinDate;
  }

  get activeRentalCount(): number {
    return this.props.activeRentalCount;
  }

  get totalRentals(): number {
    return this.props.totalRentals;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  /**
   * Check if member can rent more equipment based on tier limits
   */
  canRent(): boolean {
    if (!this.props.isActive) {
      return false;
    }

    const maxRentals = getMaxConcurrentRentals(this.props.tier);
    return this.props.activeRentalCount < maxRentals;
  }

  /**
   * Get maximum number of days this member can rent based on tier
   */
  getMaxRentalDays(): number {
    return getMaxRentalDays(this.props.tier);
  }

  /**
   * Apply tier-based discount to a rental cost
   */
  applyDiscount(cost: Money): Money {
    const discountPercent = getDiscountPercentage(this.props.tier);
    if (discountPercent === 0) {
      return cost;
    }

    const discountMultiplier = 1 - discountPercent / 100;
    return cost.multiply(discountMultiplier);
  }

  /**
   * Increment active rental count when a new rental is created
   */
  incrementActiveRentals(): void {
    if (!this.canRent()) {
      throw new Error('Member has reached maximum concurrent rental limit');
    }

    this.props.activeRentalCount += 1;
    this.props.totalRentals += 1;
  }

  /**
   * Decrement active rental count when a rental is returned
   */
  decrementActiveRentals(): void {
    if (this.props.activeRentalCount === 0) {
      throw new Error('No active rentals to decrement');
    }

    this.props.activeRentalCount -= 1;
  }

  /**
   * Upgrade member's tier
   */
  upgradeTier(newTier: MembershipTier): void {
    this.props.tier = newTier;
  }

  /**
   * Deactivate member account
   */
  deactivate(): void {
    if (this.props.activeRentalCount > 0) {
      throw new Error('Cannot deactivate member with active rentals');
    }

    this.props.isActive = false;
  }

  /**
   * Reactivate member account
   */
  reactivate(): void {
    this.props.isActive = true;
  }

  /**
   * Update member email
   */
  updateEmail(newEmail: string): void {
    if (!newEmail || !Member.isValidEmail(newEmail)) {
      throw new Error('Invalid email address');
    }
    this.props.email = newEmail;
  }

  /**
   * Update member name
   */
  updateName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error('Member name cannot be empty');
    }
    this.props.name = newName;
  }

  /**
   * Get member snapshot for persistence
   */
  toSnapshot(): MemberProps {
    return { ...this.props };
  }
}
