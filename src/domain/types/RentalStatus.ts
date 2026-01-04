/**
 * Represents the lifecycle state of a rental
 */
export enum RentalStatus {
  RESERVED = 'RESERVED',
  ACTIVE = 'ACTIVE',
  OVERDUE = 'OVERDUE',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
}

export namespace RentalStatus {
  /**
   * Check if rental is in an active state (not yet returned or cancelled)
   */
  export function isActive(status: RentalStatus): boolean {
    return status === RentalStatus.ACTIVE || status === RentalStatus.OVERDUE;
  }

  /**
   * Check if rental is completed (returned or cancelled)
   */
  export function isCompleted(status: RentalStatus): boolean {
    return status === RentalStatus.RETURNED || status === RentalStatus.CANCELLED;
  }

  /**
   * Check if equipment is currently in possession of renter
   */
  export function isInPossession(status: RentalStatus): boolean {
    return status === RentalStatus.ACTIVE || status === RentalStatus.OVERDUE;
  }

  /**
   * Get all status values
   */
  export function values(): RentalStatus[] {
    return Object.values(RentalStatus).filter((v) => typeof v === 'string') as RentalStatus[];
  }
}
