/**
 * Data Transfer Objects for Equipment HTTP endpoints
 * These DTOs define the contract between the HTTP layer and clients
 */

/**
 * Response body for getting available equipment
 */
export interface GetAvailableEquipmentResponse {
  equipmentId: string;
  name: string;
  description: string;
  category: string;
  dailyRate: number;
  condition: string;
}

/**
 * Request body for creating equipment
 */
export interface CreateEquipmentRequest {
  name: string;
  description?: string;
  category: string;
  dailyRate: number;
  condition?: string;
}

/**
 * Request body for updating equipment
 */
export interface UpdateEquipmentRequest {
  name?: string;
  description?: string;
  category?: string;
  dailyRate?: number;
  condition?: string;
}

/**
 * Response body for getting equipment details
 */
export interface GetEquipmentResponse {
  equipmentId: string;
  name: string;
  description: string;
  category: string;
  dailyRate: number;
  condition: string;
  isAvailable: boolean;
  currentRentalId?: string;
}
