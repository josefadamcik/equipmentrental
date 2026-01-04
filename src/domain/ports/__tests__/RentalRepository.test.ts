import { RentalRepository } from '../RentalRepository';
import { Rental } from '../../entities/Rental';
import { RentalId, MemberId, EquipmentId } from '../../value-objects/identifiers';
import { Money } from '../../value-objects/Money';
import { DateRange } from '../../value-objects/DateRange';
import { RentalStatus } from '../../types/RentalStatus';
import { EquipmentCondition } from '../../types/EquipmentCondition';

/**
 * Mock implementation of RentalRepository for testing
 */
class MockRentalRepository implements RentalRepository {
  private rentals: Map<string, Rental> = new Map();

  async findById(id: RentalId): Promise<Rental | undefined> {
    return this.rentals.get(id.value);
  }

  async findAll(): Promise<Rental[]> {
    return Array.from(this.rentals.values());
  }

  async findByMemberId(memberId: MemberId): Promise<Rental[]> {
    return Array.from(this.rentals.values()).filter((r) => r.memberId.equals(memberId));
  }

  async findByEquipmentId(equipmentId: EquipmentId): Promise<Rental[]> {
    return Array.from(this.rentals.values()).filter((r) => r.equipmentId.equals(equipmentId));
  }

  async findByStatus(status: RentalStatus): Promise<Rental[]> {
    return Array.from(this.rentals.values()).filter((r) => r.status === status);
  }

  async findActive(): Promise<Rental[]> {
    return this.findByStatus(RentalStatus.ACTIVE);
  }

  async findActiveByMemberId(memberId: MemberId): Promise<Rental[]> {
    return Array.from(this.rentals.values()).filter(
      (r) => r.memberId.equals(memberId) && r.status === RentalStatus.ACTIVE,
    );
  }

  async findActiveByEquipmentId(equipmentId: EquipmentId): Promise<Rental | undefined> {
    return Array.from(this.rentals.values()).find(
      (r) => r.equipmentId.equals(equipmentId) && r.status === RentalStatus.ACTIVE,
    );
  }

  async findOverdue(now: Date = new Date()): Promise<Rental[]> {
    return Array.from(this.rentals.values()).filter((r) => r.isOverdue(now));
  }

  async findEndingInPeriod(period: DateRange): Promise<Rental[]> {
    return Array.from(this.rentals.values()).filter((r) => period.contains(r.period.end));
  }

  async findByCreatedDateRange(startDate: Date, endDate: Date): Promise<Rental[]> {
    return Array.from(this.rentals.values()).filter(
      (r) => r.createdAt >= startDate && r.createdAt <= endDate,
    );
  }

  async findByReturnedDateRange(startDate: Date, endDate: Date): Promise<Rental[]> {
    return Array.from(this.rentals.values()).filter(
      (r) => r.returnedAt && r.returnedAt >= startDate && r.returnedAt <= endDate,
    );
  }

  async save(rental: Rental): Promise<void> {
    this.rentals.set(rental.id.value, rental);
  }

  async delete(id: RentalId): Promise<void> {
    this.rentals.delete(id.value);
  }

  async exists(id: RentalId): Promise<boolean> {
    return this.rentals.has(id.value);
  }

  async count(): Promise<number> {
    return this.rentals.size;
  }

  async countByStatus(status: RentalStatus): Promise<number> {
    return (await this.findByStatus(status)).length;
  }

  async countActiveByMemberId(memberId: MemberId): Promise<number> {
    return (await this.findActiveByMemberId(memberId)).length;
  }

  clear(): void {
    this.rentals.clear();
  }
}

describe('RentalRepository Port', () => {
  let repository: MockRentalRepository;
  let rental: Rental;
  const memberId = MemberId.generate();
  const equipmentId = EquipmentId.generate();

  beforeEach(() => {
    repository = new MockRentalRepository();
    rental = Rental.create({
      equipmentId,
      memberId,
      period: DateRange.create(new Date('2024-01-01'), new Date('2024-01-10')),
      baseCost: Money.dollars(100),
      conditionAtStart: EquipmentCondition.EXCELLENT,
    });
  });

  describe('save', () => {
    it('should save rental', async () => {
      await repository.save(rental);
      const found = await repository.findById(rental.id);
      expect(found).toBeDefined();
      expect(found?.baseCost.amount).toBe(100);
    });

    it('should update existing rental', async () => {
      await repository.save(rental);
      rental.returnRental(EquipmentCondition.GOOD);
      await repository.save(rental);

      const found = await repository.findById(rental.id);
      expect(found?.status).toBe(RentalStatus.RETURNED);
    });
  });

  describe('findById', () => {
    it('should find rental by id', async () => {
      await repository.save(rental);
      const found = await repository.findById(rental.id);
      expect(found).toBeDefined();
      expect(found?.id.equals(rental.id)).toBe(true);
    });

    it('should return undefined for non-existent id', async () => {
      const nonExistentId = RentalId.generate();
      const found = await repository.findById(nonExistentId);
      expect(found).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should return empty array when no rentals exist', async () => {
      const all = await repository.findAll();
      expect(all).toEqual([]);
    });

    it('should return all rentals', async () => {
      const rental2 = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(new Date('2024-02-01'), new Date('2024-02-10')),
        baseCost: Money.dollars(150),
        conditionAtStart: EquipmentCondition.GOOD,
      });

      await repository.save(rental);
      await repository.save(rental2);

      const all = await repository.findAll();
      expect(all).toHaveLength(2);
    });
  });

  describe('findByMemberId', () => {
    it('should find rentals by member', async () => {
      const otherMemberId = MemberId.generate();
      const rental2 = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId: otherMemberId,
        period: DateRange.create(new Date('2024-02-01'), new Date('2024-02-10')),
        baseCost: Money.dollars(150),
        conditionAtStart: EquipmentCondition.GOOD,
      });

      await repository.save(rental);
      await repository.save(rental2);

      const memberRentals = await repository.findByMemberId(memberId);
      expect(memberRentals).toHaveLength(1);
      expect(memberRentals[0].memberId.equals(memberId)).toBe(true);
    });
  });

  describe('findByEquipmentId', () => {
    it('should find rentals by equipment', async () => {
      const otherEquipmentId = EquipmentId.generate();
      const rental2 = Rental.create({
        equipmentId: otherEquipmentId,
        memberId,
        period: DateRange.create(new Date('2024-02-01'), new Date('2024-02-10')),
        baseCost: Money.dollars(150),
        conditionAtStart: EquipmentCondition.GOOD,
      });

      await repository.save(rental);
      await repository.save(rental2);

      const equipmentRentals = await repository.findByEquipmentId(equipmentId);
      expect(equipmentRentals).toHaveLength(1);
      expect(equipmentRentals[0].equipmentId.equals(equipmentId)).toBe(true);
    });
  });

  describe('findByStatus', () => {
    it('should find rentals by status', async () => {
      const rental2 = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(new Date('2024-02-01'), new Date('2024-02-10')),
        baseCost: Money.dollars(150),
        conditionAtStart: EquipmentCondition.GOOD,
      });

      await repository.save(rental);
      await repository.save(rental2);

      const activeRentals = await repository.findByStatus(RentalStatus.ACTIVE);
      expect(activeRentals).toHaveLength(2);

      rental.returnRental(EquipmentCondition.GOOD);
      await repository.save(rental);

      const returnedRentals = await repository.findByStatus(RentalStatus.RETURNED);
      expect(returnedRentals).toHaveLength(1);
    });
  });

  describe('findActive', () => {
    it('should find only active rentals', async () => {
      await repository.save(rental);

      const active = await repository.findActive();
      expect(active).toHaveLength(1);

      rental.returnRental(EquipmentCondition.GOOD);
      await repository.save(rental);

      const activeAfterReturn = await repository.findActive();
      expect(activeAfterReturn).toHaveLength(0);
    });
  });

  describe('findActiveByMemberId', () => {
    it('should find active rentals for specific member', async () => {
      const otherMemberId = MemberId.generate();
      const rental2 = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId: otherMemberId,
        period: DateRange.create(new Date('2024-02-01'), new Date('2024-02-10')),
        baseCost: Money.dollars(150),
        conditionAtStart: EquipmentCondition.GOOD,
      });

      await repository.save(rental);
      await repository.save(rental2);

      const memberActiveRentals = await repository.findActiveByMemberId(memberId);
      expect(memberActiveRentals).toHaveLength(1);
      expect(memberActiveRentals[0].memberId.equals(memberId)).toBe(true);
    });
  });

  describe('findActiveByEquipmentId', () => {
    it('should find active rental for specific equipment', async () => {
      await repository.save(rental);

      const activeRental = await repository.findActiveByEquipmentId(equipmentId);
      expect(activeRental).toBeDefined();
      expect(activeRental?.equipmentId.equals(equipmentId)).toBe(true);

      rental.returnRental(EquipmentCondition.GOOD);
      await repository.save(rental);

      const noActiveRental = await repository.findActiveByEquipmentId(equipmentId);
      expect(noActiveRental).toBeUndefined();
    });
  });

  describe('findOverdue', () => {
    it('should find overdue rentals', async () => {
      const pastRental = Rental.create({
        equipmentId,
        memberId,
        period: DateRange.create(new Date('2020-01-01'), new Date('2020-01-10')),
        baseCost: Money.dollars(100),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });

      await repository.save(rental);
      await repository.save(pastRental);

      const overdue = await repository.findOverdue(new Date('2024-01-15'));
      expect(overdue.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('findByCreatedDateRange', () => {
    it('should find rentals by creation date', async () => {
      await repository.save(rental);

      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const found = await repository.findByCreatedDateRange(yesterday, tomorrow);
      expect(found.length).toBeGreaterThan(0);
    });
  });

  describe('delete', () => {
    it('should delete rental', async () => {
      await repository.save(rental);
      expect(await repository.exists(rental.id)).toBe(true);

      await repository.delete(rental.id);
      expect(await repository.exists(rental.id)).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true for existing rental', async () => {
      await repository.save(rental);
      expect(await repository.exists(rental.id)).toBe(true);
    });

    it('should return false for non-existent rental', async () => {
      const nonExistentId = RentalId.generate();
      expect(await repository.exists(nonExistentId)).toBe(false);
    });
  });

  describe('count', () => {
    it('should count all rentals', async () => {
      expect(await repository.count()).toBe(0);

      await repository.save(rental);
      expect(await repository.count()).toBe(1);
    });
  });

  describe('countByStatus', () => {
    it('should count rentals by status', async () => {
      const rental2 = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(new Date('2024-02-01'), new Date('2024-02-10')),
        baseCost: Money.dollars(150),
        conditionAtStart: EquipmentCondition.GOOD,
      });

      await repository.save(rental);
      await repository.save(rental2);

      expect(await repository.countByStatus(RentalStatus.ACTIVE)).toBe(2);

      rental.returnRental(EquipmentCondition.GOOD);
      await repository.save(rental);

      expect(await repository.countByStatus(RentalStatus.ACTIVE)).toBe(1);
      expect(await repository.countByStatus(RentalStatus.RETURNED)).toBe(1);
    });
  });

  describe('countActiveByMemberId', () => {
    it('should count active rentals for member', async () => {
      const rental2 = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(new Date('2024-02-01'), new Date('2024-02-10')),
        baseCost: Money.dollars(150),
        conditionAtStart: EquipmentCondition.GOOD,
      });

      await repository.save(rental);
      await repository.save(rental2);

      expect(await repository.countActiveByMemberId(memberId)).toBe(2);

      rental.returnRental(EquipmentCondition.GOOD);
      await repository.save(rental);

      expect(await repository.countActiveByMemberId(memberId)).toBe(1);
    });
  });

  describe('type compliance', () => {
    it('should implement all required methods', () => {
      const repo: RentalRepository = repository;
      expect(typeof repo.findById).toBe('function');
      expect(typeof repo.findAll).toBe('function');
      expect(typeof repo.findByMemberId).toBe('function');
      expect(typeof repo.findByEquipmentId).toBe('function');
      expect(typeof repo.findByStatus).toBe('function');
      expect(typeof repo.findActive).toBe('function');
      expect(typeof repo.findActiveByMemberId).toBe('function');
      expect(typeof repo.findActiveByEquipmentId).toBe('function');
      expect(typeof repo.findOverdue).toBe('function');
      expect(typeof repo.findEndingInPeriod).toBe('function');
      expect(typeof repo.findByCreatedDateRange).toBe('function');
      expect(typeof repo.findByReturnedDateRange).toBe('function');
      expect(typeof repo.save).toBe('function');
      expect(typeof repo.delete).toBe('function');
      expect(typeof repo.exists).toBe('function');
      expect(typeof repo.count).toBe('function');
      expect(typeof repo.countByStatus).toBe('function');
      expect(typeof repo.countActiveByMemberId).toBe('function');
    });
  });
});
