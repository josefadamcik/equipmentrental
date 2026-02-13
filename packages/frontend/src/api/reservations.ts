/**
 * Reservations API functions.
 *
 * Endpoints:
 *   POST   /api/reservations                      - create a reservation
 *   GET    /api/reservations/:id                  - get reservation details
 *   PUT    /api/reservations/:id/confirm          - confirm a reservation
 *   DELETE /api/reservations/:id                  - cancel a reservation (RESTful)
 *   POST   /api/reservations/:id/fulfill          - fulfill a reservation (convert to rental)
 */

import { get, post, put, del } from './client';
import type {
  ReservationResponse,
  CreateReservationRequest,
  CreateReservationResult,
  ConfirmReservationRequest,
  ConfirmReservationResult,
  CancelReservationRequest,
  CancelReservationResult,
  FulfillReservationRequest,
  FulfillReservationResult,
} from '../types/api';

/**
 * POST /api/reservations
 * Creates a new reservation.
 */
export function createReservation(
  data: CreateReservationRequest,
): Promise<CreateReservationResult> {
  return post<CreateReservationResult>('/api/reservations', data);
}

/**
 * GET /api/reservations/:id
 * Returns details for a single reservation.
 */
export function getReservation(id: string): Promise<ReservationResponse> {
  return get<ReservationResponse>(`/api/reservations/${encodeURIComponent(id)}`);
}

/**
 * PUT /api/reservations/:id/confirm
 * Confirms a pending reservation.
 */
export function confirmReservation(
  id: string,
  data?: ConfirmReservationRequest,
): Promise<ConfirmReservationResult> {
  return put<ConfirmReservationResult>(
    `/api/reservations/${encodeURIComponent(id)}/confirm`,
    data ?? {},
  );
}

/**
 * DELETE /api/reservations/:id
 * Cancels a reservation. Body is optional (reason, refund info).
 */
export function cancelReservation(
  id: string,
  data?: CancelReservationRequest,
): Promise<CancelReservationResult> {
  return del<CancelReservationResult>(
    `/api/reservations/${encodeURIComponent(id)}`,
    data,
  );
}

/**
 * POST /api/reservations/:id/fulfill
 * Fulfills a confirmed reservation by converting it into a rental.
 */
export function fulfillReservation(
  id: string,
  data: FulfillReservationRequest,
): Promise<FulfillReservationResult> {
  return post<FulfillReservationResult>(
    `/api/reservations/${encodeURIComponent(id)}/fulfill`,
    data,
  );
}
