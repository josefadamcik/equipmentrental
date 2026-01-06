import { InMemoryEquipmentRepository } from '../InMemoryEquipmentRepository.js';
import { Equipment } from '../../../../domain/entities/Equipment.js';
import { EquipmentId } from '../../../../domain/value-objects/identifiers.js';
import { Money } from '../../../../domain/value-objects/Money.js';
import { DateRange } from '../../../../domain/value-objects/DateRange.js';
import { EquipmentCondition } from '../../../../domain/types/EquipmentCondition.js';

describe('InMemoryEquipmentRepository', () => {
  let repository: InMemoryEquipmentRepository;

  beforeEach(() => {
    repository = new InMemoryEquipmentRepository();
  });

  describe('save and findById', () => {
    it('should save and retrieve equipment by id', async () => {
      const equipment = Equipment.create({
        name: 'Hammer',
        description: 'A standard hammer',
        category: 'Tools',
        dailyRate: Money.dollars(10),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date('2024-01-01'),
      });

      await repository.save(equipment);

      const found = await repository.findById(equipment.id);
      expect(found).toBeDefined();
      expect(found?.id.value).toBe(equipment.id.value);
      expect(found?.name).toBe('Hammer');
    });

    it('should return undefined for non-existent id', async () => {
      const id = EquipmentId.generate();
      const found = await repository.findById(id);
      expect(found).toBeUndefined();
    });

    it('should update existing equipment', async () => {
      const equipment = Equipment.create({
        name: 'Hammer',
        description: 'A standard hammer',
        category: 'Tools',
        dailyRate: Money.dollars(10),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date('2024-01-01'),
      });

      await repository.save(equipment);

      equipment.updateDailyRate(Money.dollars(15));
      await repository.save(equipment);

      const found = await repository.findById(equipment.id);
      expect(found?.dailyRate.amount).toBe(15);
    });
  });

  describe('findAll', () => {
    it('should return empty array when no equipment exists', async () => {
      const all = await repository.findAll();
      expect(all).toEqual([]);
    });

    it('should return all equipment', async () => {
      const equipment1 = Equipment.create({
        name: 'Hammer',
        description: 'A standard hammer',
        category: 'Tools',
        dailyRate: Money.dollars(10),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date('2024-01-01'),
      });

      const equipment2 = Equipment.create({
        name: 'Drill',
        description: 'Power drill',
        category: 'Power Tools',
        dailyRate: Money.dollars(20),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date('2024-01-01'),
      });

      await repository.save(equipment1);
      await repository.save(equipment2);

      const all = await repository.findAll();
      expect(all).toHaveLength(2);
    });
  });

  describe('findByCategory', () => {
    it('should return equipment in specified category', async () => {
      const hammer = Equipment.create({
        name: 'Hammer',
        description: 'A standard hammer',
        category: 'Tools',
        dailyRate: Money.dollars(10),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date('2024-01-01'),
      });

      const drill = Equipment.create({
        name: 'Drill',
        description: 'Power drill',
        category: 'Power Tools',
        dailyRate: Money.dollars(20),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date('2024-01-01'),
      });

      await repository.save(hammer);
      await repository.save(drill);

      const tools = await repository.findByCategory('Tools');
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('Hammer');
    });

    it('should return empty array for non-existent category', async () => {
      const tools = await repository.findByCategory('NonExistent');
      expect(tools).toEqual([]);
    });
  });

  describe('findAvailable', () => {
    it('should return only available equipment', async () => {
      const available = Equipment.create({
        name: 'Hammer',
        description: 'A standard hammer',
        category: 'Tools',
        dailyRate: Money.dollars(10),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date('2024-01-01'),
      });

      const unavailable = Equipment.create({
        name: 'Drill',
        description: 'Power drill',
        category: 'Power Tools',
        dailyRate: Money.dollars(20),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date('2024-01-01'),
      });
      unavailable.markAsRented('rental-123');

      await repository.save(available);
      await repository.save(unavailable);

      const availableEquipment = await repository.findAvailable();
      expect(availableEquipment).toHaveLength(1);
      expect(availableEquipment[0].name).toBe('Hammer');
    });
  });

  describe('findAvailableByCategory', () => {
    it('should return available equipment in specified category', async () => {
      const hammer = Equipment.create({
        name: 'Hammer',
        description: 'A standard hammer',
        category: 'Tools',
        dailyRate: Money.dollars(10),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date('2024-01-01'),
      });

      const screwdriver = Equipment.create({
        name: 'Screwdriver',
        description: 'A standard screwdriver',
        category: 'Tools',
        dailyRate: Money.dollars(5),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date('2024-01-01'),
      });
      screwdriver.markAsRented('rental-123');

      await repository.save(hammer);
      await repository.save(screwdriver);

      const available = await repository.findAvailableByCategory('Tools');
      expect(available).toHaveLength(1);
      expect(available[0].name).toBe('Hammer');
    });
  });

  describe('findNeedingMaintenance', () => {
    it('should return equipment needing maintenance', async () => {
      const oldEquipment = Equipment.create({
        name: 'Old Drill',
        description: 'Needs maintenance',
        category: 'Power Tools',
        dailyRate: Money.dollars(20),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date('2020-01-01'),
      });

      const newEquipment = Equipment.create({
        name: 'New Hammer',
        description: 'Recently purchased',
        category: 'Tools',
        dailyRate: Money.dollars(10),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });

      await repository.save(oldEquipment);
      await repository.save(newEquipment);

      const needsMaintenance = await repository.findNeedingMaintenance();
      expect(needsMaintenance).toHaveLength(1);
      expect(needsMaintenance[0].name).toBe('Old Drill');
    });
  });

  describe('findAvailableDuringPeriod', () => {
    it('should return available equipment', async () => {
      const equipment = Equipment.create({
        name: 'Hammer',
        description: 'A standard hammer',
        category: 'Tools',
        dailyRate: Money.dollars(10),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date('2024-01-01'),
      });

      await repository.save(equipment);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const period = DateRange.create(tomorrow, nextWeek);
      const available = await repository.findAvailableDuringPeriod(period);

      expect(available).toHaveLength(1);
      expect(available[0].name).toBe('Hammer');
    });
  });

  describe('delete', () => {
    it('should delete equipment', async () => {
      const equipment = Equipment.create({
        name: 'Hammer',
        description: 'A standard hammer',
        category: 'Tools',
        dailyRate: Money.dollars(10),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date('2024-01-01'),
      });

      await repository.save(equipment);
      await repository.delete(equipment.id);

      const found = await repository.findById(equipment.id);
      expect(found).toBeUndefined();
    });
  });

  describe('exists', () => {
    it('should return true if equipment exists', async () => {
      const equipment = Equipment.create({
        name: 'Hammer',
        description: 'A standard hammer',
        category: 'Tools',
        dailyRate: Money.dollars(10),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date('2024-01-01'),
      });

      await repository.save(equipment);

      const exists = await repository.exists(equipment.id);
      expect(exists).toBe(true);
    });

    it('should return false if equipment does not exist', async () => {
      const id = EquipmentId.generate();
      const exists = await repository.exists(id);
      expect(exists).toBe(false);
    });
  });

  describe('count', () => {
    it('should return total count of equipment', async () => {
      expect(await repository.count()).toBe(0);

      const equipment1 = Equipment.create({
        name: 'Hammer',
        description: 'A standard hammer',
        category: 'Tools',
        dailyRate: Money.dollars(10),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date('2024-01-01'),
      });

      const equipment2 = Equipment.create({
        name: 'Drill',
        description: 'Power drill',
        category: 'Power Tools',
        dailyRate: Money.dollars(20),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date('2024-01-01'),
      });

      await repository.save(equipment1);
      expect(await repository.count()).toBe(1);

      await repository.save(equipment2);
      expect(await repository.count()).toBe(2);
    });
  });

  describe('countByCategory', () => {
    it('should return count of equipment in category', async () => {
      const hammer = Equipment.create({
        name: 'Hammer',
        description: 'A standard hammer',
        category: 'Tools',
        dailyRate: Money.dollars(10),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date('2024-01-01'),
      });

      const screwdriver = Equipment.create({
        name: 'Screwdriver',
        description: 'A standard screwdriver',
        category: 'Tools',
        dailyRate: Money.dollars(5),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date('2024-01-01'),
      });

      const drill = Equipment.create({
        name: 'Drill',
        description: 'Power drill',
        category: 'Power Tools',
        dailyRate: Money.dollars(20),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date('2024-01-01'),
      });

      await repository.save(hammer);
      await repository.save(screwdriver);
      await repository.save(drill);

      expect(await repository.countByCategory('Tools')).toBe(2);
      expect(await repository.countByCategory('Power Tools')).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all equipment', async () => {
      const equipment = Equipment.create({
        name: 'Hammer',
        description: 'A standard hammer',
        category: 'Tools',
        dailyRate: Money.dollars(10),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date('2024-01-01'),
      });

      await repository.save(equipment);
      expect(await repository.count()).toBe(1);

      repository.clear();
      expect(await repository.count()).toBe(0);
    });
  });

  describe('data isolation', () => {
    it('should return clones to prevent external mutations', async () => {
      const equipment = Equipment.create({
        name: 'Hammer',
        description: 'A standard hammer',
        category: 'Tools',
        dailyRate: Money.dollars(10),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date('2024-01-01'),
      });

      await repository.save(equipment);

      const found1 = await repository.findById(equipment.id);
      const found2 = await repository.findById(equipment.id);

      // Modifying one shouldn't affect the other
      found1?.updateDailyRate(Money.dollars(20));

      expect(found2?.dailyRate.amount).toBe(10);

      // Also shouldn't affect what's in the repository
      const found3 = await repository.findById(equipment.id);
      expect(found3?.dailyRate.amount).toBe(10);
    });
  });
});
