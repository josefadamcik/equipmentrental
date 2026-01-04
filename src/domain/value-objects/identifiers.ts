import { randomUUID } from 'crypto';

/**
 * Base class for strongly-typed identifiers
 */
abstract class Identifier {
  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Identifier value cannot be empty');
    }
  }

  equals(other: Identifier): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export class EquipmentId extends Identifier {
  private constructor(value: string) {
    super(value);
  }

  static create(value: string): EquipmentId {
    return new EquipmentId(value);
  }

  static generate(): EquipmentId {
    return new EquipmentId(randomUUID());
  }
}

export class RentalId extends Identifier {
  private constructor(value: string) {
    super(value);
  }

  static create(value: string): RentalId {
    return new RentalId(value);
  }

  static generate(): RentalId {
    return new RentalId(randomUUID());
  }
}

export class MemberId extends Identifier {
  private constructor(value: string) {
    super(value);
  }

  static create(value: string): MemberId {
    return new MemberId(value);
  }

  static generate(): MemberId {
    return new MemberId(randomUUID());
  }
}

export class ReservationId extends Identifier {
  private constructor(value: string) {
    super(value);
  }

  static create(value: string): ReservationId {
    return new ReservationId(value);
  }

  static generate(): ReservationId {
    return new ReservationId(randomUUID());
  }
}

export class DamageAssessmentId extends Identifier {
  private constructor(value: string) {
    super(value);
  }

  static create(value: string): DamageAssessmentId {
    return new DamageAssessmentId(value);
  }

  static generate(): DamageAssessmentId {
    return new DamageAssessmentId(randomUUID());
  }
}
