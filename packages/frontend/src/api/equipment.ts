/**
 * Equipment API functions.
 *
 * Endpoints:
 *   GET  /api/equipment/available  - list available equipment (optionally filtered)
 *   GET  /api/equipment/:id        - get equipment details
 *   POST /api/equipment            - create equipment
 *   PUT  /api/equipment/:id        - update equipment
 */

import { get, post, put } from './client';
import type {
  EquipmentResponse,
  CreateEquipmentRequest,
  UpdateEquipmentRequest,
} from '../types/api';

/** Optional query filters for available-equipment listing */
export interface GetAvailableEquipmentFilters {
  category?: string;
}

/**
 * GET /api/equipment
 * Returns the list of available equipment, optionally filtered by category.
 */
export function getAvailableEquipment(
  filters?: GetAvailableEquipmentFilters,
): Promise<EquipmentResponse[]> {
  const params = new URLSearchParams();
  if (filters?.category) {
    params.set('category', filters.category);
  }
  const query = params.toString();
  const path = query ? `/api/equipment?${query}` : '/api/equipment';
  return get<EquipmentResponse[]>(path);
}

/**
 * GET /api/equipment/:id
 * Returns full details for a single piece of equipment.
 */
export function getEquipment(id: string): Promise<EquipmentResponse> {
  return get<EquipmentResponse>(`/api/equipment/${encodeURIComponent(id)}`);
}

/**
 * POST /api/equipment
 * Creates a new equipment record.
 */
export function createEquipment(data: CreateEquipmentRequest): Promise<EquipmentResponse> {
  return post<EquipmentResponse>('/api/equipment', data);
}

/**
 * PUT /api/equipment/:id
 * Updates an existing equipment record.
 */
export function updateEquipment(id: string, data: UpdateEquipmentRequest): Promise<EquipmentResponse> {
  return put<EquipmentResponse>(`/api/equipment/${encodeURIComponent(id)}`, data);
}
