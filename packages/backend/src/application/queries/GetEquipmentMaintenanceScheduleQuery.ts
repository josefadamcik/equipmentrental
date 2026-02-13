import { EquipmentRepository } from '../../domain/ports/EquipmentRepository.js';

/**
 * Query to get equipment maintenance schedule
 */
export interface GetEquipmentMaintenanceScheduleQuery {
  /**
   * Optional reference date (defaults to now)
   */
  asOfDate?: Date;
}

/**
 * Result of equipment maintenance schedule query
 */
export interface MaintenanceScheduleResult {
  equipmentId: string;
  name: string;
  category: string;
  condition: string;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate: Date;
  daysSinceLastMaintenance?: number;
}

/**
 * Handler for querying equipment maintenance schedule
 * Fetches all equipment that needs maintenance
 */
export class GetEquipmentMaintenanceScheduleQueryHandler {
  constructor(private readonly equipmentRepository: EquipmentRepository) {}

  async execute(query: GetEquipmentMaintenanceScheduleQuery): Promise<MaintenanceScheduleResult[]> {
    const now = query.asOfDate || new Date();
    const equipmentNeedingMaintenance = await this.equipmentRepository.findNeedingMaintenance(now);

    // Map domain entities to result DTOs
    return equipmentNeedingMaintenance.map((equipment) => {
      let daysSinceLastMaintenance: number | undefined;
      let nextMaintenanceDate: Date;

      if (equipment.lastMaintenanceDate) {
        const timeDiff = now.getTime() - equipment.lastMaintenanceDate.getTime();
        daysSinceLastMaintenance = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

        // Next maintenance is 90 days after last maintenance
        nextMaintenanceDate = new Date(equipment.lastMaintenanceDate);
        nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + 90);
      } else {
        // If no maintenance yet, next maintenance is 90 days after purchase
        nextMaintenanceDate = new Date(equipment.purchaseDate);
        nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + 90);
      }

      return {
        equipmentId: equipment.id.value,
        name: equipment.name,
        category: equipment.category,
        condition: equipment.condition,
        lastMaintenanceDate: equipment.lastMaintenanceDate,
        nextMaintenanceDate,
        daysSinceLastMaintenance,
      };
    });
  }
}
