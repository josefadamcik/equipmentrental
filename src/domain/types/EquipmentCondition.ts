/**
 * Represents the physical condition of equipment
 */
export enum EquipmentCondition {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
  DAMAGED = 'DAMAGED',
  UNDER_REPAIR = 'UNDER_REPAIR',
}

export namespace EquipmentCondition {
  /**
   * Check if equipment is available for rental based on condition
   */
  export function isRentable(condition: EquipmentCondition): boolean {
    return condition === EquipmentCondition.EXCELLENT || condition === EquipmentCondition.GOOD || condition === EquipmentCondition.FAIR;
  }

  /**
   * Check if equipment needs repair
   */
  export function needsRepair(condition: EquipmentCondition): boolean {
    return condition === EquipmentCondition.DAMAGED || condition === EquipmentCondition.UNDER_REPAIR;
  }

  /**
   * Get all condition values
   */
  export function values(): EquipmentCondition[] {
    return Object.values(EquipmentCondition).filter((v) => typeof v === 'string') as EquipmentCondition[];
  }
}
