/**
 * Members API functions.
 *
 * Endpoints:
 *   GET  /api/members             - list all members
 *   GET  /api/members/:id         - get member details
 *   POST /api/members             - create member
 *   PUT  /api/members/:id         - update member
 */

import { get, post, put } from './client';
import type {
  MemberResponse,
  CreateMemberRequest,
  UpdateMemberRequest,
  MemberRentalResponse,
} from '../types/api';

/**
 * GET /api/members
 * Returns the list of all members.
 */
export function getMembers(): Promise<MemberResponse[]> {
  return get<MemberResponse[]>('/api/members');
}

/**
 * GET /api/members/:id
 * Returns details for a single member.
 */
export function getMember(id: string): Promise<MemberResponse> {
  return get<MemberResponse>(`/api/members/${encodeURIComponent(id)}`);
}

/**
 * POST /api/members
 * Creates a new member.
 */
export function createMember(data: CreateMemberRequest): Promise<MemberResponse> {
  return post<MemberResponse>('/api/members', data);
}

/**
 * PUT /api/members/:id
 * Updates an existing member.
 */
export function updateMember(id: string, data: UpdateMemberRequest): Promise<MemberResponse> {
  return put<MemberResponse>(`/api/members/${encodeURIComponent(id)}`, data);
}

/**
 * GET /api/members/:id/rentals
 * Returns the rental history for a specific member.
 */
export function getMemberRentals(id: string): Promise<MemberRentalResponse[]> {
  return get<MemberRentalResponse[]>(`/api/members/${encodeURIComponent(id)}/rentals`);
}
