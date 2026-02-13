/**
 * API Types for the Equipment Rental System frontend.
 * These interfaces mirror the backend DTOs exactly.
 */

// ---------------------------------------------------------------------------
// Enums / const objects
// ---------------------------------------------------------------------------

export const EquipmentCondition = {
  EXCELLENT: 'EXCELLENT',
  GOOD: 'GOOD',
  FAIR: 'FAIR',
  POOR: 'POOR',
  DAMAGED: 'DAMAGED',
  UNDER_REPAIR: 'UNDER_REPAIR',
} as const;

export type EquipmentCondition = (typeof EquipmentCondition)[keyof typeof EquipmentCondition];

export const RentalStatus = {
  RESERVED: 'RESERVED',
  ACTIVE: 'ACTIVE',
  OVERDUE: 'OVERDUE',
  RETURNED: 'RETURNED',
  CANCELLED: 'CANCELLED',
} as const;

export type RentalStatus = (typeof RentalStatus)[keyof typeof RentalStatus];

export const MembershipTier = {
  BASIC: 'BASIC',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  PLATINUM: 'PLATINUM',
} as const;

export type MembershipTier = (typeof MembershipTier)[keyof typeof MembershipTier];

export const ReservationStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  FULFILLED: 'FULFILLED',
} as const;

export type ReservationStatus = (typeof ReservationStatus)[keyof typeof ReservationStatus];

// ---------------------------------------------------------------------------
// Common types
// ---------------------------------------------------------------------------

/** Standard error response returned by the API. */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    /** Present on VALIDATION_ERROR responses */
    fields?: Array<{ field: string; message: string }>;
  };
}

// ---------------------------------------------------------------------------
// Equipment types
// ---------------------------------------------------------------------------

/** Response item from GET /api/equipment/available */
export interface EquipmentResponse {
  equipmentId: string;
  name: string;
  description: string;
  category: string;
  dailyRate: number;
  condition: string;
  /** Only present on GET /api/equipment/:id */
  isAvailable?: boolean;
  /** Only present on GET /api/equipment/:id */
  currentRentalId?: string;
}

/** Request body for POST /api/equipment (future endpoint) */
export interface CreateEquipmentRequest {
  name: string;
  description: string;
  category: string;
  dailyRate: number;
  condition: EquipmentCondition;
}

/** Request body for PUT /api/equipment/:id (future endpoint) */
export interface UpdateEquipmentRequest {
  name?: string;
  description?: string;
  category?: string;
  dailyRate?: number;
  condition?: EquipmentCondition;
}

// ---------------------------------------------------------------------------
// Member types
// ---------------------------------------------------------------------------

/** Response from GET /api/members/:memberId */
export interface MemberResponse {
  memberId: string;
  name: string;
  email: string;
  tier: string;
  joinDate: string;
  isActive: boolean;
  activeRentalCount: number;
}

/** Request body for POST /api/members (future endpoint) */
export interface CreateMemberRequest {
  name: string;
  email: string;
  tier?: MembershipTier;
}

/** Request body for PUT /api/members/:id (future endpoint) */
export interface UpdateMemberRequest {
  name?: string;
  email?: string;
  tier?: MembershipTier;
  isActive?: boolean;
}

/** Response item from GET /api/members/:memberId/rentals */
export interface MemberRentalResponse {
  rentalId: string;
  equipmentId: string;
  equipmentName: string;
  startDate: string;
  endDate: string;
  status: string;
  totalCost: number;
}

// ---------------------------------------------------------------------------
// Rental types
// ---------------------------------------------------------------------------

/** Response from GET /api/rentals/:rentalId */
export interface RentalResponse {
  rentalId: string;
  equipmentId: string;
  memberId: string;
  startDate: string;
  endDate: string;
  status: string;
  totalCost: number;
  conditionAtStart: string;
  conditionAtReturn?: string;
  actualReturnDate?: string;
  lateFee?: number;
}

/** Request body for POST /api/rentals */
export interface CreateRentalRequest {
  equipmentId: string;
  memberId: string;
  startDate: string;
  endDate: string;
  paymentMethod: {
    type: string;
    token?: string;
  };
  notificationChannel?: 'EMAIL' | 'SMS';
}

/** Response from POST /api/rentals */
export interface CreateRentalResult {
  rentalId: string;
  totalCost: number;
  discountApplied: number;
  transactionId: string;
  paymentStatus: string;
}

/** Request body for PUT /api/rentals/:id/return */
export interface ReturnRentalRequest {
  conditionAtReturn: string;
  returnDate?: string;
  paymentMethod?: {
    type: string;
    token?: string;
  };
  notificationChannel?: 'EMAIL' | 'SMS';
}

/** Response from PUT /api/rentals/:id/return */
export interface ReturnRentalResult {
  rentalId: string;
  totalCost: number;
  lateFee: number;
  damageFee: number;
  transactionId?: string;
  paymentStatus?: string;
  refundTransactionId?: string;
  refundAmount?: number;
}

/** Request body for PUT /api/rentals/:id/extend */
export interface ExtendRentalRequest {
  additionalDays: number;
  paymentMethod: {
    type: string;
    token?: string;
  };
  notificationChannel?: 'EMAIL' | 'SMS';
}

/** Response from PUT /api/rentals/:id/extend */
export interface ExtendRentalResult {
  rentalId: string;
  newEndDate: string;
  additionalCost: number;
  transactionId: string;
  paymentStatus: string;
}

// ---------------------------------------------------------------------------
// Reservation types
// ---------------------------------------------------------------------------

/** Response from GET /api/reservations/:reservationId */
export interface ReservationResponse {
  reservationId: string;
  equipmentId: string;
  memberId: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

/** Request body for POST /api/reservations */
export interface CreateReservationRequest {
  equipmentId: string;
  memberId: string;
  startDate: string;
  endDate: string;
  paymentMethod?: {
    type: string;
    token?: string;
  };
  authorizePayment?: boolean;
  notificationChannel?: 'EMAIL' | 'SMS';
}

/** Response from POST /api/reservations */
export interface CreateReservationResult {
  reservationId: string;
  equipmentId: string;
  memberId: string;
  equipmentName: string;
  startDate: string;
  endDate: string;
  status: string;
  paymentStatus: string;
  authorizationId?: string;
  totalCost?: number;
  discountApplied?: number;
}

/** Request body for PUT /api/reservations/:id/confirm */
export interface ConfirmReservationRequest {
  notificationChannel?: 'EMAIL' | 'SMS';
}

/** Response from PUT /api/reservations/:id/confirm */
export interface ConfirmReservationResult {
  reservationId: string;
  confirmedAt: string;
}

/** Request body for DELETE /api/reservations/:id */
export interface CancelReservationRequest {
  reason?: string;
  authorizationId?: string;
  notificationChannel?: 'EMAIL' | 'SMS';
}

/** Response from DELETE /api/reservations/:id */
export interface CancelReservationResult {
  reservationId: string;
  status: string;
  cancelledAt: string;
  refundAmount?: number;
  refundStatus?: string;
  refundTransactionId?: string;
}

/** Request body for POST /api/reservations/:id/fulfill */
export interface FulfillReservationRequest {
  paymentMethod: {
    type: string;
    token?: string;
  };
  authorizationId?: string;
  notificationChannel?: 'EMAIL' | 'SMS';
}

/** Response from POST /api/reservations/:id/fulfill */
export interface FulfillReservationResult {
  reservationId: string;
  rentalId: string;
  totalCost: number;
  transactionId: string;
  paymentStatus: string;
}
