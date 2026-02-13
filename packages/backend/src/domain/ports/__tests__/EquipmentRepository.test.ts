import { EquipmentRepository } from '../EquipmentRepository';
import { Equipment } from '../../entities/Equipment';
import { EquipmentId } from '../../value-objects/identifiers';
import { Money } from '../../value-objects/Money';
import { EquipmentCondition } from '../../types/EquipmentCondition';

/**
 * Mock implementation of EquipmentRepository for testing
 */
class MockEquipmentRepository implements EquipmentRepository {
  private equipment: Map<string, Equipment> = new Map();

  async findById(id: EquipmentId): Promise<Equipment | undefined> {
    return this.equipment.get(id.value);
  }

  async findAll(): Promise<Equipment[]> {
    return Array.from(this.equipment.values());
  }

  async findByCategory(category: string): Promise<Equipment[]> {
    return Array.from(this.equipment.values()).filter((e) => e.category === category);
  }

  async findAvailable(): Promise<Equipment[]> {
    return Array.from(this.equipment.values()).filter((e) => e.isAvailable);
  }

  async findAvailableByCategory(category: string): Promise<Equipment[]> {
    return Array.from(this.equipment.values()).filter(
      (e) => e.isAvailable && e.category === category,
    );
  }

  async findNeedingMaintenance(now: Date = new Date()): Promise<Equipment[]> {
    return Array.from(this.equipment.values()).filter((e) => e.needsMaintenance(now));
  }

  async findAvailableDuringPeriod(): Promise<Equipment[]> {
    return this.findAvailable();
  }

  async save(equipment: Equipment): Promise<void> {
    this.equipment.set(equipment.id.value, equipment);
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
    return (await this.findByCategory(category)).length;
  }

  clear(): void {
    this.equipment.clear();
  }
}

describe('EquipmentRepository Port', () => {
  let repository: MockEquipmentRepository;
  let equipment: Equipment;

  beforeEach(() => {
    repository = new MockEquipmentRepository();
    equipment = Equipment.create({
      name: 'Drill',
      description: 'Power drill',
      category: 'Tools',
      dailyRate: Money.dollars(25),
      condition: EquipmentCondition.EXCELLENT,
      purchaseDate: new Date('2024-01-01'),
    });
  });

  describe('save', () => {
    it('should save equipment', async () => {
      await repository.save(equipment);
      const found = await repository.findById(equipment.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe('Drill');
    });

    it('should update existing equipment', async () => {
      await repository.save(equipment);
      equipment.updateDailyRate(Money.dollars(30));
      await repository.save(equipment);

      const found = await repository.findById(equipment.id);
      expect(found?.dailyRate.amount).toBe(30);
    });
  });

  describe('findById', () => {
    it('should find equipment by id', async () => {
      await repository.save(equipment);
      const found = await repository.findById(equipment.id);
      expect(found).toBeDefined();
      expect(found?.id.equals(equipment.id)).toBe(true);
    });

    it('should return undefined for non-existent id', async () => {
      const nonExistentId = EquipmentId.generate();
      const found = await repository.findById(nonExistentId);
      expect(found).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should return empty array when no equipment exists', async () => {
      const all = await repository.findAll();
      expect(all).toEqual([]);
    });

    it('should return all equipment', async () => {
      const equipment2 = Equipment.create({
        name: 'Saw',
        description: 'Circular saw',
        category: 'Tools',
        dailyRate: Money.dollars(35),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date('2024-02-01'),
      });

      await repository.save(equipment);
      await repository.save(equipment2);

      const all = await repository.findAll();
      expect(all).toHaveLength(2);
    });
  });

  describe('findByCategory', () => {
    it('should find equipment by category', async () => {
      const ladder = Equipment.create({
        name: 'Ladder',
        description: 'Extension ladder',
        category: 'Scaffolding',
        dailyRate: Money.dollars(20),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date('2024-01-01'),
      });

      await repository.save(equipment);
      await repository.save(ladder);

      const tools = await repository.findByCategory('Tools');
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('Drill');

      const scaffolding = await repository.findByCategory('Scaffolding');
      expect(scaffolding).toHaveLength(1);
      expect(scaffolding[0].name).toBe('Ladder');
    });

    it('should return empty array for category with no equipment', async () => {
      const result = await repository.findByCategory('NonExistent');
      expect(result).toEqual([]);
    });
  });

  describe('findAvailable', () => {
    it('should find only available equipment', async () => {
      await repository.save(equipment);

      equipment.markAsRented('rental-123');
      await repository.save(equipment);

      const available = await repository.findAvailable();
      expect(available).toHaveLength(0);

      equipment.markAsReturned(EquipmentCondition.GOOD);
      await repository.save(equipment);

      const availableAfterReturn = await repository.findAvailable();
      expect(availableAfterReturn).toHaveLength(1);
    });
  });

  describe('findAvailableByCategory', () => {
    it('should find available equipment in specific category', async () => {
      const ladder = Equipment.create({
        name: 'Ladder',
        description: 'Extension ladder',
        category: 'Scaffolding',
        dailyRate: Money.dollars(20),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date('2024-01-01'),
      });

      await repository.save(equipment);
      await repository.save(ladder);

      equipment.markAsRented('rental-123');
      await repository.save(equipment);

      const availableTools = await repository.findAvailableByCategory('Tools');
      expect(availableTools).toHaveLength(0);

      const availableScaffolding = await repository.findAvailableByCategory('Scaffolding');
      expect(availableScaffolding).toHaveLength(1);
    });
  });

  describe('findNeedingMaintenance', () => {
    it('should find equipment needing maintenance', async () => {
      const oldEquipment = Equipment.create({
        name: 'Old Drill',
        description: 'Needs maintenance',
        category: 'Tools',
        dailyRate: Money.dollars(25),
        condition: EquipmentCondition.FAIR,
        purchaseDate: new Date('2020-01-01'),
      });

      await repository.save(equipment);
      await repository.save(oldEquipment);

      const needsMaintenance = await repository.findNeedingMaintenance();
      expect(needsMaintenance.length).toBeGreaterThan(0);
    });
  });

  describe('delete', () => {
    it('should delete equipment', async () => {
      await repository.save(equipment);
      expect(await repository.exists(equipment.id)).toBe(true);

      await repository.delete(equipment.id);
      expect(await repository.exists(equipment.id)).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true for existing equipment', async () => {
      await repository.save(equipment);
      expect(await repository.exists(equipment.id)).toBe(true);
    });

    it('should return false for non-existent equipment', async () => {
      const nonExistentId = EquipmentId.generate();
      expect(await repository.exists(nonExistentId)).toBe(false);
    });
  });

  describe('count', () => {
    it('should count all equipment', async () => {
      expect(await repository.count()).toBe(0);

      await repository.save(equipment);
      expect(await repository.count()).toBe(1);

      const equipment2 = Equipment.create({
        name: 'Saw',
        description: 'Circular saw',
        category: 'Tools',
        dailyRate: Money.dollars(35),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date('2024-02-01'),
      });
      await repository.save(equipment2);
      expect(await repository.count()).toBe(2);
    });
  });

  describe('countByCategory', () => {
    it('should count equipment by category', async () => {
      const ladder = Equipment.create({
        name: 'Ladder',
        description: 'Extension ladder',
        category: 'Scaffolding',
        dailyRate: Money.dollars(20),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date('2024-01-01'),
      });

      await repository.save(equipment);
      await repository.save(ladder);

      expect(await repository.countByCategory('Tools')).toBe(1);
      expect(await repository.countByCategory('Scaffolding')).toBe(1);
      expect(await repository.countByCategory('NonExistent')).toBe(0);
    });
  });

  describe('type compliance', () => {
    it('should implement all required methods', () => {
      const repo: EquipmentRepository = repository;
      expect(typeof repo.findById).toBe('function');
      expect(typeof repo.findAll).toBe('function');
      expect(typeof repo.findByCategory).toBe('function');
      expect(typeof repo.findAvailable).toBe('function');
      expect(typeof repo.findAvailableByCategory).toBe('function');
      expect(typeof repo.findNeedingMaintenance).toBe('function');
      expect(typeof repo.findAvailableDuringPeriod).toBe('function');
      expect(typeof repo.save).toBe('function');
      expect(typeof repo.delete).toBe('function');
      expect(typeof repo.exists).toBe('function');
      expect(typeof repo.count).toBe('function');
      expect(typeof repo.countByCategory).toBe('function');
    });
  });
});
