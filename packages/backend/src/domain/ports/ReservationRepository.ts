import { Reservation, ReservationStatus } from '../entities/Reservation.js';
import { ReservationId, MemberId, EquipmentId } from '../value-objects/identifiers.js';
import { DateRange } from '../value-objects/DateRange.js';

/**
 * Repository interface for Reservation aggregate persistence
 * Defines the contract for storing and retrieving reservation entities
 */
export interface ReservationRepository {
  /**
   * Find reservation by its unique identifier
   * @param id - The reservation identifier
   * @returns The reservation if found, undefined otherwise
   */
  findById(id: ReservationId): Promise<Reservation | undefined>;

  /**
   * Find all reservations
   * @returns Array of all reservations
   */
  findAll(): Promise<Reservation[]>;

  /**
   * Find reservations by member
   * @param memberId - The member identifier
   * @returns Array of reservations for the member
   */
  findByMemberId(memberId: MemberId): Promise<Reservation[]>;

  /**
   * Find reservations by equipment
   * @param equipmentId - The equipment identifier
   * @returns Array of reservations for the equipment
   */
  findByEquipmentId(equipmentId: EquipmentId): Promise<Reservation[]>;

  /**
   * Find reservations by status
   * @param status - The reservation status to filter by
   * @returns Array of reservations with the specified status
   */
  findByStatus(status: ReservationStatus): Promise<Reservation[]>;

  /**
   * Find active reservations (pending or confirmed)
   * @param now - Current date (defaults to now)
   * @returns Array of active reservations
   */
  findActive(now?: Date): Promise<Reservation[]>;

  /**
   * Find active reservations for a specific member
   * @param memberId - The member identifier
   * @param now - Current date (defaults to now)
   * @returns Array of active reservations for the member
   */
  findActiveByMemberId(memberId: MemberId, now?: Date): Promise<Reservation[]>;

  /**
   * Find active reservations for specific equipment
   * @param equipmentId - The equipment identifier
   * @param now - Current date (defaults to now)
   * @returns Array of active reservations for the equipment
   */
  findActiveByEquipmentId(equipmentId: EquipmentId, now?: Date): Promise<Reservation[]>;

  /**
   * Find reservations that overlap with a specific period
   * Critical for preventing double-booking
   * @param equipmentId - The equipment identifier
   * @param period - The period to check for conflicts
   * @returns Array of reservations that overlap with the period
   */
  findConflicting(equipmentId: EquipmentId, period: DateRange): Promise<Reservation[]>;

  /**
   * Find reservations ready to be fulfilled
   * Confirmed reservations whose start date has arrived
   * @param now - Current date (defaults to now)
   * @returns Array of reservations ready to fulfill
   */
  findReadyToFulfill(now?: Date): Promise<Reservation[]>;

  /**
   * Find reservations that have expired
   * Reservations that ended without being fulfilled
   * @param now - Current date (defaults to now)
   * @returns Array of expired reservations
   */
  findExpired(now?: Date): Promise<Reservation[]>;

  /**
   * Find reservations starting within a specific period
   * Useful for sending reminders
   * @param period - The date range to check
   * @returns Array of reservations starting in the period
   */
  findStartingInPeriod(period: DateRange): Promise<Reservation[]>;

  /**
   * Find reservations created within a date range
   * Useful for reporting and analytics
   * @param startDate - Start of the date range
   * @param endDate - End of the date range
   * @returns Array of reservations created in the period
   */
  findByCreatedDateRange(startDate: Date, endDate: Date): Promise<Reservation[]>;

  /**
   * Save a new reservation or update an existing one
   * @param reservation - The reservation to save
   */
  save(reservation: Reservation): Promise<void>;

  /**
   * Delete reservation by its identifier
   * @param id - The reservation identifier
   */
  delete(id: ReservationId): Promise<void>;

  /**
   * Check if reservation exists
   * @param id - The reservation identifier
   * @returns True if reservation exists, false otherwise
   */
  exists(id: ReservationId): Promise<boolean>;

  /**
   * Count total number of reservations
   * @returns Total count of reservations
   */
  count(): Promise<number>;

  /**
   * Count reservations by status
   * @param status - The reservation status
   * @returns Count of reservations with the status
   */
  countByStatus(status: ReservationStatus): Promise<number>;

  /**
   * Count active reservations for a member
   * @param memberId - The member identifier
   * @param now - Current date (defaults to now)
   * @returns Count of active reservations for the member
   */
  countActiveByMemberId(memberId: MemberId, now?: Date): Promise<number>;
}
