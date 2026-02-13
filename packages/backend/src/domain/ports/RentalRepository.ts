import { Rental } from '../entities/Rental.js';
import { RentalId, MemberId, EquipmentId } from '../value-objects/identifiers.js';
import { RentalStatus } from '../types/RentalStatus.js';
import { DateRange } from '../value-objects/DateRange.js';

/**
 * Repository interface for Rental aggregate persistence
 * Defines the contract for storing and retrieving rental entities
 */
export interface RentalRepository {
  /**
   * Find rental by its unique identifier
   * @param id - The rental identifier
   * @returns The rental if found, undefined otherwise
   */
  findById(id: RentalId): Promise<Rental | undefined>;

  /**
   * Find all rentals
   * @returns Array of all rentals
   */
  findAll(): Promise<Rental[]>;

  /**
   * Find rentals by member
   * @param memberId - The member identifier
   * @returns Array of rentals for the member
   */
  findByMemberId(memberId: MemberId): Promise<Rental[]>;

  /**
   * Find rentals by equipment
   * @param equipmentId - The equipment identifier
   * @returns Array of rentals for the equipment
   */
  findByEquipmentId(equipmentId: EquipmentId): Promise<Rental[]>;

  /**
   * Find rentals by status
   * @param status - The rental status to filter by
   * @returns Array of rentals with the specified status
   */
  findByStatus(status: RentalStatus): Promise<Rental[]>;

  /**
   * Find active rentals (currently ongoing)
   * @returns Array of active rentals
   */
  findActive(): Promise<Rental[]>;

  /**
   * Find active rentals for a specific member
   * @param memberId - The member identifier
   * @returns Array of active rentals for the member
   */
  findActiveByMemberId(memberId: MemberId): Promise<Rental[]>;

  /**
   * Find active rental for specific equipment
   * @param equipmentId - The equipment identifier
   * @returns The active rental if exists, undefined otherwise
   */
  findActiveByEquipmentId(equipmentId: EquipmentId): Promise<Rental | undefined>;

  /**
   * Find overdue rentals
   * Rentals that have passed their end date
   * @param now - Current date (defaults to now)
   * @returns Array of overdue rentals
   */
  findOverdue(now?: Date): Promise<Rental[]>;

  /**
   * Find rentals that end within a specific period
   * Useful for generating upcoming return reminders
   * @param period - The date range to check
   * @returns Array of rentals ending in the period
   */
  findEndingInPeriod(period: DateRange): Promise<Rental[]>;

  /**
   * Find rentals created within a date range
   * Useful for reporting and analytics
   * @param startDate - Start of the date range
   * @param endDate - End of the date range
   * @returns Array of rentals created in the period
   */
  findByCreatedDateRange(startDate: Date, endDate: Date): Promise<Rental[]>;

  /**
   * Find rentals returned within a date range
   * Useful for reporting and analytics
   * @param startDate - Start of the date range
   * @param endDate - End of the date range
   * @returns Array of rentals returned in the period
   */
  findByReturnedDateRange(startDate: Date, endDate: Date): Promise<Rental[]>;

  /**
   * Save a new rental or update an existing one
   * @param rental - The rental to save
   */
  save(rental: Rental): Promise<void>;

  /**
   * Delete rental by its identifier
   * @param id - The rental identifier
   */
  delete(id: RentalId): Promise<void>;

  /**
   * Check if rental exists
   * @param id - The rental identifier
   * @returns True if rental exists, false otherwise
   */
  exists(id: RentalId): Promise<boolean>;

  /**
   * Count total number of rentals
   * @returns Total count of rentals
   */
  count(): Promise<number>;

  /**
   * Count rentals by status
   * @param status - The rental status
   * @returns Count of rentals with the status
   */
  countByStatus(status: RentalStatus): Promise<number>;

  /**
   * Count active rentals for a member
   * @param memberId - The member identifier
   * @returns Count of active rentals for the member
   */
  countActiveByMemberId(memberId: MemberId): Promise<number>;
}
