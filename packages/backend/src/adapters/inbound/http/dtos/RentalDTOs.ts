/**
 * Data Transfer Objects for Rental HTTP endpoints
 * These DTOs define the contract between the HTTP layer and clients
 */

/**
 * Request body for creating a rental
 */
export interface CreateRentalRequest {
  equipmentId: string;
  memberId: string;
  startDate: string; // ISO 8601 date string
  endDate: string; // ISO 8601 date string
  paymentMethod: {
    type: string;
    token?: string;
  };
  notificationChannel?: 'EMAIL' | 'SMS';
}

/**
 * Response body for creating a rental
 */
export interface CreateRentalResponse {
  rentalId: string;
  totalCost: number;
  discountApplied: number;
  transactionId: string;
  paymentStatus: string;
}

/**
 * Request body for returning a rental
 */
export interface ReturnRentalRequest {
  conditionAtReturn: string;
  returnDate?: string; // ISO 8601 date string - defaults to current date if not provided
  paymentMethod?: {
    type: string;
    token?: string;
  };
  notificationChannel?: 'EMAIL' | 'SMS';
}

/**
 * Response body for returning a rental
 */
export interface ReturnRentalResponse {
  rentalId: string;
  totalCost: number;
  lateFee: number;
  damageFee: number;
  transactionId?: string;
  paymentStatus?: string;
  refundTransactionId?: string;
  refundAmount?: number;
}

/**
 * Request body for extending a rental
 */
export interface ExtendRentalRequest {
  additionalDays: number;
  paymentMethod: {
    type: string;
    token?: string;
  };
  notificationChannel?: 'EMAIL' | 'SMS';
}

/**
 * Response body for extending a rental
 */
export interface ExtendRentalResponse {
  rentalId: string;
  newEndDate: string; // ISO 8601 date string
  additionalCost: number;
  transactionId: string;
  paymentStatus: string;
}

/**
 * Response body for getting a rental
 */
export interface GetRentalResponse {
  rentalId: string;
  equipmentId: string;
  memberId: string;
  startDate: string; // ISO 8601 date string
  endDate: string; // ISO 8601 date string
  status: string;
  totalCost: number;
  conditionAtStart: string;
  conditionAtReturn?: string;
  actualReturnDate?: string; // ISO 8601 date string
  lateFee?: number;
}
