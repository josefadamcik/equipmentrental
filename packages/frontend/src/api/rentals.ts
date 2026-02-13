/**
 * Rentals API functions.
 *
 * Endpoints:
 *   POST /api/rentals                         - create a rental
 *   GET  /api/rentals/:id                     - get rental details
 *   PUT  /api/rentals/:id/return              - return a rental
 *   PUT  /api/rentals/:id/extend              - extend a rental
 *   GET  /api/rentals/member/:memberId        - get member's rentals
 *   GET  /api/rentals/status/overdue          - get overdue rentals
 */

import { get, post, put } from './client';
import type {
  RentalResponse,
  CreateRentalRequest,
  CreateRentalResult,
  ReturnRentalRequest,
  ReturnRentalResult,
  ExtendRentalRequest,
  ExtendRentalResult,
} from '../types/api';

/**
 * POST /api/rentals
 * Creates a new rental and processes payment.
 */
export function createRental(data: CreateRentalRequest): Promise<CreateRentalResult> {
  return post<CreateRentalResult>('/api/rentals', data);
}

/**
 * GET /api/rentals/:id
 * Returns details for a single rental.
 */
export function getRental(id: string): Promise<RentalResponse> {
  return get<RentalResponse>(`/api/rentals/${encodeURIComponent(id)}`);
}

/**
 * PUT /api/rentals/:id/return
 * Processes the return of a rental, including optional damage assessment and fees.
 */
export function returnRental(id: string, data: ReturnRentalRequest): Promise<ReturnRentalResult> {
  return put<ReturnRentalResult>(`/api/rentals/${encodeURIComponent(id)}/return`, data);
}

/**
 * PUT /api/rentals/:id/extend
 * Extends the rental period by the given number of additional days.
 */
export function extendRental(id: string, data: ExtendRentalRequest): Promise<ExtendRentalResult> {
  return put<ExtendRentalResult>(`/api/rentals/${encodeURIComponent(id)}/extend`, data);
}

/**
 * GET /api/rentals/member/:memberId
 * Returns all rentals associated with a specific member.
 */
export function getMemberRentals(memberId: string): Promise<RentalResponse[]> {
  return get<RentalResponse[]>(`/api/rentals/member/${encodeURIComponent(memberId)}`);
}

/**
 * GET /api/rentals/status/overdue
 * Returns all currently overdue rentals.
 */
export function getOverdueRentals(): Promise<RentalResponse[]> {
  return get<RentalResponse[]>('/api/rentals/status/overdue');
}
