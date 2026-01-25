import { Equipment } from '../Equipment.js';
import { Money } from '../../value-objects/Money.js';
import { EquipmentCondition } from '../../types/EquipmentCondition.js';

describe('Equipment Entity', () => {
  describe('create', () => {
    it('should create equipment with valid properties', () => {
      const equipment = Equipment.create({
        name: 'Power Drill',
        description: 'Professional grade power drill',
        category: 'Tools',
        dailyRate: Money.dollars(25),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date('2024-01-01'),
      });

      expect(equipment.name).toBe('Power Drill');
      expect(equipment.description).toBe('Professional grade power drill');
      expect(equipment.category).toBe('Tools');
      expect(equipment.dailyRate.equals(Money.dollars(25))).toBe(true);
      expect(equipment.condition).toBe(EquipmentCondition.EXCELLENT);
      expect(equipment.isAvailable).toBe(true);
    });

    it('should throw error if name is empty', () => {
      expect(() =>
        Equipment.create({
          name: '',
          description: 'Description',
          category: 'Tools',
          dailyRate: Money.dollars(25),
          condition: EquipmentCondition.EXCELLENT,
          purchaseDate: new Date(),
        }),
      ).toThrow('Equipment name cannot be empty');
    });

    it('should throw error if category is empty', () => {
      expect(() =>
        Equipment.create({
          name: 'Power Drill',
          description: 'Description',
          category: '',
          dailyRate: Money.dollars(25),
          condition: EquipmentCondition.EXCELLENT,
          purchaseDate: new Date(),
        }),
      ).toThrow('Equipment category cannot be empty');
    });

    it('should allow zero daily rate for promotional equipment', () => {
      const equipment = Equipment.create({
        name: 'Power Drill',
        description: 'Description',
        category: 'Tools',
        dailyRate: Money.zero(),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });

      expect(equipment.dailyRate.equals(Money.zero())).toBe(true);
    });

    it('should mark equipment as unavailable if condition is not rentable', () => {
      const equipment = Equipment.create({
        name: 'Power Drill',
        description: 'Description',
        category: 'Tools',
        dailyRate: Money.dollars(25),
        condition: EquipmentCondition.DAMAGED,
        purchaseDate: new Date(),
      });

      expect(equipment.isAvailable).toBe(false);
    });
  });

  describe('markAsRented', () => {
    it('should mark available equipment as rented', () => {
      const equipment = Equipment.create({
        name: 'Power Drill',
        description: 'Description',
        category: 'Tools',
        dailyRate: Money.dollars(25),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });

      equipment.markAsRented('rental-123');

      expect(equipment.isAvailable).toBe(false);
      expect(equipment.currentRentalId).toBe('rental-123');
    });

    it('should throw error if equipment is not available', () => {
      const equipment = Equipment.create({
        name: 'Power Drill',
        description: 'Description',
        category: 'Tools',
        dailyRate: Money.dollars(25),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });

      equipment.markAsRented('rental-123');

      expect(() => equipment.markAsRented('rental-456')).toThrow(
        'Equipment is not available for rental',
      );
    });

    it('should throw error if condition is not rentable', () => {
      const equipment = Equipment.create({
        name: 'Power Drill',
        description: 'Description',
        category: 'Tools',
        dailyRate: Money.dollars(25),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });

      equipment.updateCondition(EquipmentCondition.DAMAGED);

      expect(() => equipment.markAsRented('rental-123')).toThrow(
        'Equipment is not available for rental',
      );
    });
  });

  describe('markAsReturned', () => {
    it('should mark rented equipment as returned', () => {
      const equipment = Equipment.create({
        name: 'Power Drill',
        description: 'Description',
        category: 'Tools',
        dailyRate: Money.dollars(25),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });

      equipment.markAsRented('rental-123');
      equipment.markAsReturned(EquipmentCondition.GOOD);

      expect(equipment.isAvailable).toBe(true);
      expect(equipment.currentRentalId).toBeUndefined();
      expect(equipment.condition).toBe(EquipmentCondition.GOOD);
    });

    it('should mark equipment as unavailable if returned in damaged condition', () => {
      const equipment = Equipment.create({
        name: 'Power Drill',
        description: 'Description',
        category: 'Tools',
        dailyRate: Money.dollars(25),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });

      equipment.markAsRented('rental-123');
      equipment.markAsReturned(EquipmentCondition.DAMAGED);

      expect(equipment.isAvailable).toBe(false);
      expect(equipment.condition).toBe(EquipmentCondition.DAMAGED);
    });

    it('should throw error if equipment is not rented', () => {
      const equipment = Equipment.create({
        name: 'Power Drill',
        description: 'Description',
        category: 'Tools',
        dailyRate: Money.dollars(25),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });

      expect(() => equipment.markAsReturned(EquipmentCondition.GOOD)).toThrow(
        'Equipment is not currently rented',
      );
    });
  });

  describe('updateCondition', () => {
    it('should update equipment condition', () => {
      const equipment = Equipment.create({
        name: 'Power Drill',
        description: 'Description',
        category: 'Tools',
        dailyRate: Money.dollars(25),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });

      equipment.updateCondition(EquipmentCondition.GOOD);

      expect(equipment.condition).toBe(EquipmentCondition.GOOD);
      expect(equipment.isAvailable).toBe(true);
    });

    it('should mark equipment as unavailable when condition becomes unrentable', () => {
      const equipment = Equipment.create({
        name: 'Power Drill',
        description: 'Description',
        category: 'Tools',
        dailyRate: Money.dollars(25),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });

      equipment.updateCondition(EquipmentCondition.UNDER_REPAIR);

      expect(equipment.condition).toBe(EquipmentCondition.UNDER_REPAIR);
      expect(equipment.isAvailable).toBe(false);
    });
  });

  describe('recordMaintenance', () => {
    it('should record maintenance date', () => {
      const equipment = Equipment.create({
        name: 'Power Drill',
        description: 'Description',
        category: 'Tools',
        dailyRate: Money.dollars(25),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date('2024-01-01'),
      });

      const maintenanceDate = new Date('2024-06-01');
      equipment.recordMaintenance(maintenanceDate);

      expect(equipment.lastMaintenanceDate).toEqual(maintenanceDate);
    });
  });

  describe('updateDailyRate', () => {
    it('should update daily rate', () => {
      const equipment = Equipment.create({
        name: 'Power Drill',
        description: 'Description',
        category: 'Tools',
        dailyRate: Money.dollars(25),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });

      equipment.updateDailyRate(Money.dollars(30));

      expect(equipment.dailyRate.equals(Money.dollars(30))).toBe(true);
    });

    it('should allow zero rate for promotional equipment', () => {
      const equipment = Equipment.create({
        name: 'Power Drill',
        description: 'Description',
        category: 'Tools',
        dailyRate: Money.dollars(25),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });

      equipment.updateDailyRate(Money.zero());
      expect(equipment.dailyRate.equals(Money.zero())).toBe(true);
    });

    it('should throw error if new rate is negative', () => {
      const equipment = Equipment.create({
        name: 'Power Drill',
        description: 'Description',
        category: 'Tools',
        dailyRate: Money.dollars(25),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });

      expect(() => equipment.updateDailyRate(Money.dollars(-10))).toThrow(
        'Money amount cannot be negative',
      );
    });
  });

  describe('needsMaintenance', () => {
    it('should return true if no maintenance in last 90 days', () => {
      const purchaseDate = new Date('2024-01-01');
      const equipment = Equipment.create({
        name: 'Power Drill',
        description: 'Description',
        category: 'Tools',
        dailyRate: Money.dollars(25),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate,
      });

      const now = new Date('2024-04-02'); // 91 days later
      expect(equipment.needsMaintenance(now)).toBe(true);
    });

    it('should return false if maintenance was recent', () => {
      const purchaseDate = new Date('2024-01-01');
      const equipment = Equipment.create({
        name: 'Power Drill',
        description: 'Description',
        category: 'Tools',
        dailyRate: Money.dollars(25),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate,
      });

      equipment.recordMaintenance(new Date('2024-03-01'));
      const now = new Date('2024-04-01'); // 31 days after maintenance
      expect(equipment.needsMaintenance(now)).toBe(false);
    });
  });

  describe('calculateRentalCost', () => {
    it('should calculate rental cost for given days', () => {
      const equipment = Equipment.create({
        name: 'Power Drill',
        description: 'Description',
        category: 'Tools',
        dailyRate: Money.dollars(25),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });

      const cost = equipment.calculateRentalCost(5);

      expect(cost.equals(Money.dollars(125))).toBe(true);
    });

    it('should throw error for non-positive days', () => {
      const equipment = Equipment.create({
        name: 'Power Drill',
        description: 'Description',
        category: 'Tools',
        dailyRate: Money.dollars(25),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });

      expect(() => equipment.calculateRentalCost(0)).toThrow('Number of days must be positive');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute equipment from snapshot', () => {
      const equipment = Equipment.create({
        name: 'Power Drill',
        description: 'Description',
        category: 'Tools',
        dailyRate: Money.dollars(25),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });

      const snapshot = equipment.toSnapshot();
      const reconstituted = Equipment.reconstitute(snapshot);

      expect(reconstituted.name).toBe(equipment.name);
      expect(reconstituted.id.equals(equipment.id)).toBe(true);
      expect(reconstituted.dailyRate.equals(equipment.dailyRate)).toBe(true);
    });
  });
});
