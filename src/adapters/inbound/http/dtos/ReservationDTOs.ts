/**
 * Data Transfer Objects for Reservation HTTP endpoints
 * These DTOs define the contract between the HTTP layer and clients
 */

/**
 * Request body for creating a reservation
 */
export interface CreateReservationRequest {
  equipmentId: string;
  memberId: string;
  startDate: string; // ISO 8601 date string
  endDate: string; // ISO 8601 date string
  paymentMethod?: {
    type: string;
    token?: string;
  };
  authorizePayment?: boolean;
  notificationChannel?: 'EMAIL' | 'SMS';
}

/**
 * Response body for creating a reservation
 */
export interface CreateReservationResponse {
  reservationId: string;
  equipmentName: string;
  startDate: string; // ISO 8601 date string
  endDate: string; // ISO 8601 date string
  authorizationId?: string;
}

/**
 * Request body for cancelling a reservation
 */
export interface CancelReservationRequest {
  reason?: string;
  authorizationId?: string;
  notificationChannel?: 'EMAIL' | 'SMS';
}

/**
 * Response body for cancelling a reservation
 */
export interface CancelReservationResponse {
  reservationId: string;
  cancelledAt: string; // ISO 8601 date string
  refundAmount?: number;
  refundTransactionId?: string;
}

/**
 * Request body for confirming a reservation
 */
export interface ConfirmReservationRequest {
  notificationChannel?: 'EMAIL' | 'SMS';
}

/**
 * Response body for confirming a reservation
 */
export interface ConfirmReservationResponse {
  reservationId: string;
  confirmedAt: string; // ISO 8601 date string
}

/**
 * Request body for fulfilling a reservation
 */
export interface FulfillReservationRequest {
  paymentMethod: {
    type: string;
    token?: string;
  };
  authorizationId?: string;
  notificationChannel?: 'EMAIL' | 'SMS';
}

/**
 * Response body for fulfilling a reservation
 */
export interface FulfillReservationResponse {
  reservationId: string;
  rentalId: string;
  totalCost: number;
  transactionId: string;
  paymentStatus: string;
}

/**
 * Response body for getting a reservation
 */
export interface GetReservationResponse {
  reservationId: string;
  equipmentId: string;
  memberId: string;
  startDate: string; // ISO 8601 date string
  endDate: string; // ISO 8601 date string
  status: string;
  createdAt: string; // ISO 8601 date string
}
