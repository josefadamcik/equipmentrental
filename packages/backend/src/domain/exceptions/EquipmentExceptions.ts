import { DomainException } from './DomainException.js';

/**
 * Thrown when equipment is not available for rental
 */
export class EquipmentNotAvailableError extends DomainException {
  constructor(equipmentId: string, reason: string, metadata?: Record<string, unknown>) {
    super(`Equipment ${equipmentId} is not available: ${reason}`, 'EQUIPMENT_NOT_AVAILABLE', {
      equipmentId,
      reason,
      ...metadata,
    });
  }
}

/**
 * Thrown when equipment cannot be found
 */
export class EquipmentNotFoundError extends DomainException {
  constructor(equipmentId: string, metadata?: Record<string, unknown>) {
    super(`Equipment not found with ID: ${equipmentId}`, 'EQUIPMENT_NOT_FOUND', {
      equipmentId,
      ...metadata,
    });
  }
}

/**
 * Thrown when attempting to rent equipment that is already rented
 */
export class EquipmentAlreadyRentedError extends DomainException {
  constructor(equipmentId: string, currentRentalId: string, metadata?: Record<string, unknown>) {
    super(
      `Equipment ${equipmentId} is already rented (Rental ID: ${currentRentalId})`,
      'EQUIPMENT_ALREADY_RENTED',
      { equipmentId, currentRentalId, ...metadata },
    );
  }
}

/**
 * Thrown when equipment is in maintenance and cannot be rented
 */
export class EquipmentInMaintenanceError extends DomainException {
  constructor(equipmentId: string, metadata?: Record<string, unknown>) {
    super(`Equipment ${equipmentId} is currently in maintenance`, 'EQUIPMENT_IN_MAINTENANCE', {
      equipmentId,
      ...metadata,
    });
  }
}

/**
 * Thrown when equipment condition is too poor for rental
 */
export class EquipmentConditionUnacceptableError extends DomainException {
  constructor(equipmentId: string, currentCondition: string, metadata?: Record<string, unknown>) {
    super(
      `Equipment ${equipmentId} condition '${currentCondition}' is unacceptable for rental`,
      'EQUIPMENT_CONDITION_UNACCEPTABLE',
      { equipmentId, currentCondition, ...metadata },
    );
  }
}

/**
 * Thrown when attempting to perform an invalid operation on retired equipment
 */
export class EquipmentRetiredError extends DomainException {
  constructor(equipmentId: string, metadata?: Record<string, unknown>) {
    super(`Equipment ${equipmentId} has been retired and cannot be used`, 'EQUIPMENT_RETIRED', {
      equipmentId,
      ...metadata,
    });
  }
}
