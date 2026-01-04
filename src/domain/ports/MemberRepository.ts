import { Member } from '../entities/Member.js';
import { MemberId } from '../value-objects/identifiers.js';
import { MembershipTier } from '../types/MembershipTier.js';

/**
 * Repository interface for Member aggregate persistence
 * Defines the contract for storing and retrieving member entities
 */
export interface MemberRepository {
  /**
   * Find member by their unique identifier
   * @param id - The member identifier
   * @returns The member if found, undefined otherwise
   */
  findById(id: MemberId): Promise<Member | undefined>;

  /**
   * Find member by email address
   * Email should be unique in the system
   * @param email - The member's email address
   * @returns The member if found, undefined otherwise
   */
  findByEmail(email: string): Promise<Member | undefined>;

  /**
   * Find all members
   * @returns Array of all members
   */
  findAll(): Promise<Member[]>;

  /**
   * Find members by membership tier
   * @param tier - The membership tier to filter by
   * @returns Array of members with the specified tier
   */
  findByTier(tier: MembershipTier): Promise<Member[]>;

  /**
   * Find all active members
   * @returns Array of active members
   */
  findActive(): Promise<Member[]>;

  /**
   * Find members with active rentals
   * @returns Array of members who currently have rentals
   */
  findWithActiveRentals(): Promise<Member[]>;

  /**
   * Find members who joined within a date range
   * Useful for reporting and analytics
   * @param startDate - Start of the date range
   * @param endDate - End of the date range
   * @returns Array of members who joined in the period
   */
  findByJoinDateRange(startDate: Date, endDate: Date): Promise<Member[]>;

  /**
   * Save a new member or update an existing one
   * @param member - The member to save
   */
  save(member: Member): Promise<void>;

  /**
   * Delete member by their identifier
   * Should only be allowed if member has no active rentals
   * @param id - The member identifier
   */
  delete(id: MemberId): Promise<void>;

  /**
   * Check if member exists
   * @param id - The member identifier
   * @returns True if member exists, false otherwise
   */
  exists(id: MemberId): Promise<boolean>;

  /**
   * Check if email is already registered
   * @param email - The email to check
   * @returns True if email exists, false otherwise
   */
  emailExists(email: string): Promise<boolean>;

  /**
   * Count total number of members
   * @returns Total count of members
   */
  count(): Promise<number>;

  /**
   * Count active members
   * @returns Count of active members
   */
  countActive(): Promise<number>;

  /**
   * Count members by tier
   * @param tier - The membership tier
   * @returns Count of members in the tier
   */
  countByTier(tier: MembershipTier): Promise<number>;
}
