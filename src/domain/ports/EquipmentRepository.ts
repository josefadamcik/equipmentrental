import { Equipment } from '../entities/Equipment.js';
import { EquipmentId } from '../value-objects/identifiers.js';
import { DateRange } from '../value-objects/DateRange.js';

/**
 * Repository interface for Equipment aggregate persistence
 * Defines the contract for storing and retrieving equipment entities
 */
export interface EquipmentRepository {
  /**
   * Find equipment by its unique identifier
   * @param id - The equipment identifier
   * @returns The equipment if found, undefined otherwise
   */
  findById(id: EquipmentId): Promise<Equipment | undefined>;

  /**
   * Find all equipment items
   * @returns Array of all equipment items
   */
  findAll(): Promise<Equipment[]>;

  /**
   * Find equipment by category
   * @param category - The category to filter by
   * @returns Array of equipment in the specified category
   */
  findByCategory(category: string): Promise<Equipment[]>;

  /**
   * Find all available equipment for rental
   * @returns Array of equipment that is available for rental
   */
  findAvailable(): Promise<Equipment[]>;

  /**
   * Find available equipment in a specific category
   * @param category - The category to filter by
   * @returns Array of available equipment in the specified category
   */
  findAvailableByCategory(category: string): Promise<Equipment[]>;

  /**
   * Find equipment that needs maintenance
   * @param now - Current date (defaults to now)
   * @returns Array of equipment requiring maintenance
   */
  findNeedingMaintenance(now?: Date): Promise<Equipment[]>;

  /**
   * Find equipment available during a specific period
   * Used for checking availability for reservations
   * @param period - The date range to check
   * @returns Array of equipment available during the period
   */
  findAvailableDuringPeriod(period: DateRange): Promise<Equipment[]>;

  /**
   * Save a new equipment item or update an existing one
   * @param equipment - The equipment to save
   */
  save(equipment: Equipment): Promise<void>;

  /**
   * Delete equipment by its identifier
   * @param id - The equipment identifier
   */
  delete(id: EquipmentId): Promise<void>;

  /**
   * Check if equipment exists
   * @param id - The equipment identifier
   * @returns True if equipment exists, false otherwise
   */
  exists(id: EquipmentId): Promise<boolean>;

  /**
   * Count total number of equipment items
   * @returns Total count of equipment
   */
  count(): Promise<number>;

  /**
   * Count equipment by category
   * @param category - The category to count
   * @returns Count of equipment in the category
   */
  countByCategory(category: string): Promise<number>;
}
