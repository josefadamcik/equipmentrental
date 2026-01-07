/**
 * Data Transfer Objects for Member HTTP endpoints
 * These DTOs define the contract between the HTTP layer and clients
 */

/**
 * Response body for getting member details
 */
export interface GetMemberResponse {
  memberId: string;
  name: string;
  email: string;
  tier: string;
  joinDate: string; // ISO 8601 date string
  isActive: boolean;
  activeRentalCount: number;
}

/**
 * Response body for getting member rentals
 */
export interface GetMemberRentalsResponse {
  rentalId: string;
  equipmentId: string;
  equipmentName: string;
  startDate: string; // ISO 8601 date string
  endDate: string; // ISO 8601 date string
  status: string;
  totalCost: number;
}
