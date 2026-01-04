import { EquipmentRepository } from '../../domain/ports/EquipmentRepository.js';
import { Equipment } from '../../domain/entities/Equipment.js';

/**
 * Query to get available equipment for rental
 */
export interface GetAvailableEquipmentQuery {
  /**
   * Optional category filter
   */
  category?: string;
}

/**
 * Result of available equipment query
 */
export interface AvailableEquipmentResult {
  equipmentId: string;
  name: string;
  description: string;
  category: string;
  dailyRate: number;
  condition: string;
}

/**
 * Handler for querying available equipment
 * Fetches equipment that is currently available for rental
 */
export class GetAvailableEquipmentQueryHandler {
  constructor(private readonly equipmentRepository: EquipmentRepository) {}

  async execute(query: GetAvailableEquipmentQuery): Promise<AvailableEquipmentResult[]> {
    let equipment: Equipment[];

    if (query.category) {
      // Get available equipment in specific category
      equipment = await this.equipmentRepository.findAvailableByCategory(query.category);
    } else {
      // Get all available equipment
      equipment = await this.equipmentRepository.findAvailable();
    }

    // Map domain entities to result DTOs
    return equipment.map((item) => ({
      equipmentId: item.id.value,
      name: item.name,
      description: item.description,
      category: item.category,
      dailyRate: item.dailyRate.amount,
      condition: item.condition,
    }));
  }
}
