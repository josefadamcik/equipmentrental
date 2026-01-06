import { Equipment } from '../../../domain/entities/Equipment.js';
import { EquipmentId } from '../../../domain/value-objects/identifiers.js';
import { DateRange } from '../../../domain/value-objects/DateRange.js';
import { EquipmentRepository } from '../../../domain/ports/EquipmentRepository.js';
import { isRentable } from '../../../domain/types/EquipmentCondition.js';

/**
 * In-memory implementation of EquipmentRepository for testing
 * Stores equipment in memory using a Map for fast lookups
 */
export class InMemoryEquipmentRepository implements EquipmentRepository {
  private equipment: Map<string, Equipment> = new Map();

  async findById(id: EquipmentId): Promise<Equipment | undefined> {
    const equipment = this.equipment.get(id.value);
    return equipment ? this.clone(equipment) : undefined;
  }

  async findAll(): Promise<Equipment[]> {
    return Array.from(this.equipment.values()).map((e) => this.clone(e));
  }

  async findByCategory(category: string): Promise<Equipment[]> {
    return Array.from(this.equipment.values())
      .filter((e) => e.category === category)
      .map((e) => this.clone(e));
  }

  async findAvailable(): Promise<Equipment[]> {
    return Array.from(this.equipment.values())
      .filter((e) => e.isAvailable)
      .map((e) => this.clone(e));
  }

  async findAvailableByCategory(category: string): Promise<Equipment[]> {
    return Array.from(this.equipment.values())
      .filter((e) => e.isAvailable && e.category === category)
      .map((e) => this.clone(e));
  }

  async findNeedingMaintenance(now: Date = new Date()): Promise<Equipment[]> {
    return Array.from(this.equipment.values())
      .filter((e) => e.needsMaintenance(now))
      .map((e) => this.clone(e));
  }

  async findAvailableDuringPeriod(_period: DateRange): Promise<Equipment[]> {
    // For in-memory implementation, we check if equipment is currently available
    // In a real implementation, this would check against rental and reservation schedules
    return Array.from(this.equipment.values())
      .filter((e) => e.isAvailable && isRentable(e.condition))
      .map((e) => this.clone(e));
  }

  async save(equipment: Equipment): Promise<void> {
    // Store a clone to avoid external mutations
    this.equipment.set(equipment.id.value, this.clone(equipment));
  }

  async delete(id: EquipmentId): Promise<void> {
    this.equipment.delete(id.value);
  }

  async exists(id: EquipmentId): Promise<boolean> {
    return this.equipment.has(id.value);
  }

  async count(): Promise<number> {
    return this.equipment.size;
  }

  async countByCategory(category: string): Promise<number> {
    return Array.from(this.equipment.values()).filter((e) => e.category === category).length;
  }

  /**
   * Clear all equipment from the repository
   * Useful for testing
   */
  clear(): void {
    this.equipment.clear();
  }

  /**
   * Clone an equipment entity to avoid reference issues
   */
  private clone(equipment: Equipment): Equipment {
    return Equipment.reconstitute(equipment.toSnapshot());
  }
}
