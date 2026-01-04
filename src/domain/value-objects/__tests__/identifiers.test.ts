import { EquipmentId, RentalId, MemberId, ReservationId, DamageAssessmentId } from '../identifiers.js';

describe('Identifiers', () => {
  describe('EquipmentId', () => {
    it('should create an equipment id with a value', () => {
      const id = EquipmentId.create('equip-123');
      expect(id.value).toBe('equip-123');
    });

    it('should generate a unique equipment id', () => {
      const id1 = EquipmentId.generate();
      const id2 = EquipmentId.generate();

      expect(id1.value).toBeDefined();
      expect(id2.value).toBeDefined();
      expect(id1.value).not.toBe(id2.value);
    });

    it('should throw error for empty value', () => {
      expect(() => EquipmentId.create('')).toThrow('Identifier value cannot be empty');
      expect(() => EquipmentId.create('   ')).toThrow('Identifier value cannot be empty');
    });

    it('should compare equipment ids for equality', () => {
      const id1 = EquipmentId.create('equip-123');
      const id2 = EquipmentId.create('equip-123');
      const id3 = EquipmentId.create('equip-456');

      expect(id1.equals(id2)).toBe(true);
      expect(id1.equals(id3)).toBe(false);
    });

    it('should convert to string', () => {
      const id = EquipmentId.create('equip-123');
      expect(id.toString()).toBe('equip-123');
    });
  });

  describe('RentalId', () => {
    it('should create a rental id with a value', () => {
      const id = RentalId.create('rental-123');
      expect(id.value).toBe('rental-123');
    });

    it('should generate a unique rental id', () => {
      const id1 = RentalId.generate();
      const id2 = RentalId.generate();

      expect(id1.value).toBeDefined();
      expect(id2.value).toBeDefined();
      expect(id1.value).not.toBe(id2.value);
    });

    it('should throw error for empty value', () => {
      expect(() => RentalId.create('')).toThrow('Identifier value cannot be empty');
    });

    it('should compare rental ids for equality', () => {
      const id1 = RentalId.create('rental-123');
      const id2 = RentalId.create('rental-123');
      const id3 = RentalId.create('rental-456');

      expect(id1.equals(id2)).toBe(true);
      expect(id1.equals(id3)).toBe(false);
    });
  });

  describe('MemberId', () => {
    it('should create a member id with a value', () => {
      const id = MemberId.create('member-123');
      expect(id.value).toBe('member-123');
    });

    it('should generate a unique member id', () => {
      const id1 = MemberId.generate();
      const id2 = MemberId.generate();

      expect(id1.value).toBeDefined();
      expect(id2.value).toBeDefined();
      expect(id1.value).not.toBe(id2.value);
    });

    it('should throw error for empty value', () => {
      expect(() => MemberId.create('')).toThrow('Identifier value cannot be empty');
    });

    it('should compare member ids for equality', () => {
      const id1 = MemberId.create('member-123');
      const id2 = MemberId.create('member-123');
      const id3 = MemberId.create('member-456');

      expect(id1.equals(id2)).toBe(true);
      expect(id1.equals(id3)).toBe(false);
    });
  });

  describe('ReservationId', () => {
    it('should create a reservation id with a value', () => {
      const id = ReservationId.create('reservation-123');
      expect(id.value).toBe('reservation-123');
    });

    it('should generate a unique reservation id', () => {
      const id1 = ReservationId.generate();
      const id2 = ReservationId.generate();

      expect(id1.value).toBeDefined();
      expect(id2.value).toBeDefined();
      expect(id1.value).not.toBe(id2.value);
    });

    it('should throw error for empty value', () => {
      expect(() => ReservationId.create('')).toThrow('Identifier value cannot be empty');
    });
  });

  describe('DamageAssessmentId', () => {
    it('should create a damage assessment id with a value', () => {
      const id = DamageAssessmentId.create('damage-123');
      expect(id.value).toBe('damage-123');
    });

    it('should generate a unique damage assessment id', () => {
      const id1 = DamageAssessmentId.generate();
      const id2 = DamageAssessmentId.generate();

      expect(id1.value).toBeDefined();
      expect(id2.value).toBeDefined();
      expect(id1.value).not.toBe(id2.value);
    });

    it('should throw error for empty value', () => {
      expect(() => DamageAssessmentId.create('')).toThrow('Identifier value cannot be empty');
    });
  });
});
