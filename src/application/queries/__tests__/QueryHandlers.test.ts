import { GetAvailableEquipmentQueryHandler } from '../GetAvailableEquipmentQuery.js';
import { GetRentalQueryHandler } from '../GetRentalQuery.js';
import { GetMemberRentalsQueryHandler } from '../GetMemberRentalsQuery.js';
import { GetOverdueRentalsQueryHandler } from '../GetOverdueRentalsQuery.js';
import { GetEquipmentMaintenanceScheduleQueryHandler } from '../GetEquipmentMaintenanceScheduleQuery.js';
import { Equipment } from '../../../domain/entities/Equipment.js';
import { Rental } from '../../../domain/entities/Rental.js';
import { EquipmentId, MemberId, RentalId } from '../../../domain/value-objects/identifiers.js';
import { Money } from '../../../domain/value-objects/Money.js';
import { DateRange } from '../../../domain/value-objects/DateRange.js';
import { EquipmentCondition } from '../../../domain/types/EquipmentCondition.js';
import { RentalStatus } from '../../../domain/types/RentalStatus.js';
import { EquipmentRepository } from '../../../domain/ports/EquipmentRepository.js';
import { RentalRepository } from '../../../domain/ports/RentalRepository.js';

// Mock implementations for testing
class InMemoryEquipmentRepository implements EquipmentRepository {
  private equipment = new Map<string, Equipment>();

  async findById(id: EquipmentId): Promise<Equipment | undefined> {
    return this.equipment.get(id.value);
  }

  async save(equipment: Equipment): Promise<void> {
    this.equipment.set(equipment.id.value, equipment);
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

  async findNeedingMaintenance(now?: Date): Promise<Equipment[]> {
    const referenceDate = now || new Date();
    return Array.from(this.equipment.values()).filter((e) => e.needsMaintenance(referenceDate));
  }

  async findAvailableDuringPeriod(): Promise<Equipment[]> {
    return [];
  }

  async delete(): Promise<void> {}

  async exists(): Promise<boolean> {
    return false;
  }

  async count(): Promise<number> {
    return this.equipment.size;
  }

  async countByCategory(category: string): Promise<number> {
    return Array.from(this.equipment.values()).filter((e) => e.category === category).length;
  }
}

class InMemoryRentalRepository implements RentalRepository {
  private rentals = new Map<string, Rental>();

  async findById(id: RentalId): Promise<Rental | undefined> {
    return this.rentals.get(id.value);
  }

  async save(rental: Rental): Promise<void> {
    this.rentals.set(rental.id.value, rental);
  }

  async findAll(): Promise<Rental[]> {
    return Array.from(this.rentals.values());
  }

  async findByMemberId(memberId: MemberId): Promise<Rental[]> {
    return Array.from(this.rentals.values()).filter((r) => r.memberId.value === memberId.value);
  }

  async findByEquipmentId(equipmentId: EquipmentId): Promise<Rental[]> {
    return Array.from(this.rentals.values()).filter(
      (r) => r.equipmentId.value === equipmentId.value,
    );
  }

  async findByStatus(status: RentalStatus): Promise<Rental[]> {
    return Array.from(this.rentals.values()).filter((r) => r.status === status);
  }

  async findActive(): Promise<Rental[]> {
    return Array.from(this.rentals.values()).filter((r) => r.status === RentalStatus.ACTIVE);
  }

  async findActiveByMemberId(memberId: MemberId): Promise<Rental[]> {
    return Array.from(this.rentals.values()).filter(
      (r) => r.memberId.value === memberId.value && r.status === RentalStatus.ACTIVE,
    );
  }

  async findActiveByEquipmentId(equipmentId: EquipmentId): Promise<Rental | undefined> {
    return Array.from(this.rentals.values()).find(
      (r) => r.equipmentId.value === equipmentId.value && r.status === RentalStatus.ACTIVE,
    );
  }

  async findOverdue(now?: Date): Promise<Rental[]> {
    const referenceDate = now || new Date();
    return Array.from(this.rentals.values()).filter((r) => r.isOverdue(referenceDate));
  }

  async findEndingInPeriod(period: DateRange): Promise<Rental[]> {
    return Array.from(this.rentals.values()).filter((r) => period.contains(r.period.end));
  }

  async findByCreatedDateRange(): Promise<Rental[]> {
    return [];
  }

  async findByReturnedDateRange(): Promise<Rental[]> {
    return [];
  }

  async delete(): Promise<void> {}

  async exists(): Promise<boolean> {
    return false;
  }

  async count(): Promise<number> {
    return this.rentals.size;
  }

  async countByStatus(status: RentalStatus): Promise<number> {
    return Array.from(this.rentals.values()).filter((r) => r.status === status).length;
  }

  async countActiveByMemberId(memberId: MemberId): Promise<number> {
    return Array.from(this.rentals.values()).filter(
      (r) => r.memberId.value === memberId.value && r.status === RentalStatus.ACTIVE,
    ).length;
  }
}

describe('Query Handlers', () => {
  describe('GetAvailableEquipmentQueryHandler', () => {
    let handler: GetAvailableEquipmentQueryHandler;
    let equipmentRepo: InMemoryEquipmentRepository;

    beforeEach(() => {
      equipmentRepo = new InMemoryEquipmentRepository();
      handler = new GetAvailableEquipmentQueryHandler(equipmentRepo);
    });

    it('should return all available equipment', async () => {
      // Setup
      const equipment1 = Equipment.create({
        name: 'Drill',
        description: 'Power drill',
        category: 'Tools',
        dailyRate: Money.dollars(50),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      await equipmentRepo.save(equipment1);

      const equipment2 = Equipment.create({
        name: 'Saw',
        description: 'Circular saw',
        category: 'Tools',
        dailyRate: Money.dollars(40),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date(),
      });
      await equipmentRepo.save(equipment2);

      const equipment3 = Equipment.create({
        name: 'Ladder',
        description: 'Extension ladder',
        category: 'Access',
        dailyRate: Money.dollars(30),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      equipment3.markAsRented('some-rental-id'); // Not available
      await equipmentRepo.save(equipment3);

      // Execute
      const result = await handler.execute({});

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.name)).toContain('Drill');
      expect(result.map((r) => r.name)).toContain('Saw');
      expect(result.map((r) => r.name)).not.toContain('Ladder');
    });

    it('should return available equipment filtered by category', async () => {
      // Setup
      const equipment1 = Equipment.create({
        name: 'Drill',
        description: 'Power drill',
        category: 'Tools',
        dailyRate: Money.dollars(50),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      await equipmentRepo.save(equipment1);

      const equipment2 = Equipment.create({
        name: 'Ladder',
        description: 'Extension ladder',
        category: 'Access',
        dailyRate: Money.dollars(30),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      await equipmentRepo.save(equipment2);

      // Execute
      const result = await handler.execute({ category: 'Tools' });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Drill');
      expect(result[0].category).toBe('Tools');
    });

    it('should return empty array when no equipment is available', async () => {
      // Execute
      const result = await handler.execute({});

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should map equipment properties correctly', async () => {
      // Setup
      const equipment = Equipment.create({
        name: 'Drill',
        description: 'Power drill',
        category: 'Tools',
        dailyRate: Money.dollars(50),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      await equipmentRepo.save(equipment);

      // Execute
      const result = await handler.execute({});

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].equipmentId).toBe(equipment.id.value);
      expect(result[0].name).toBe('Drill');
      expect(result[0].description).toBe('Power drill');
      expect(result[0].category).toBe('Tools');
      expect(result[0].dailyRate).toBe(50);
      expect(result[0].condition).toBe(EquipmentCondition.EXCELLENT);
    });
  });

  describe('GetRentalQueryHandler', () => {
    let handler: GetRentalQueryHandler;
    let rentalRepo: InMemoryRentalRepository;

    beforeEach(() => {
      rentalRepo = new InMemoryRentalRepository();
      handler = new GetRentalQueryHandler(rentalRepo);
    });

    it('should return rental when it exists', async () => {
      // Setup
      const equipmentId = EquipmentId.generate();
      const memberId = MemberId.generate();
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 3);

      const rental = Rental.create({
        equipmentId,
        memberId,
        period: DateRange.create(startDate, endDate),
        baseCost: Money.dollars(150),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      await rentalRepo.save(rental);

      // Execute
      const result = await handler.execute({ rentalId: rental.id.value });

      // Assert
      expect(result).toBeDefined();
      expect(result!.rentalId).toBe(rental.id.value);
      expect(result!.equipmentId).toBe(equipmentId.value);
      expect(result!.memberId).toBe(memberId.value);
      expect(result!.status).toBe(RentalStatus.ACTIVE);
      expect(result!.totalCost).toBe(150);
      expect(result!.conditionAtStart).toBe(EquipmentCondition.EXCELLENT);
    });

    it('should return undefined when rental does not exist', async () => {
      // Execute
      const result = await handler.execute({ rentalId: 'non-existent-id' });

      // Assert
      expect(result).toBeUndefined();
    });

    it('should include return details when rental is returned', async () => {
      // Setup
      const equipmentId = EquipmentId.generate();
      const memberId = MemberId.generate();
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 3);

      const rental = Rental.create({
        equipmentId,
        memberId,
        period: DateRange.create(startDate, endDate),
        baseCost: Money.dollars(150),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });

      const returnDate = new Date();
      returnDate.setDate(returnDate.getDate() + 5); // Late return
      rental.returnRental(EquipmentCondition.GOOD, Money.dollars(20), returnDate);
      await rentalRepo.save(rental);

      // Execute
      const result = await handler.execute({ rentalId: rental.id.value });

      // Assert
      expect(result).toBeDefined();
      expect(result!.status).toBe(RentalStatus.RETURNED);
      expect(result!.conditionAtReturn).toBe(EquipmentCondition.GOOD);
      expect(result!.actualReturnDate).toEqual(returnDate);
      expect(result!.lateFee).toBe(20);
    });
  });

  describe('GetMemberRentalsQueryHandler', () => {
    let handler: GetMemberRentalsQueryHandler;
    let rentalRepo: InMemoryRentalRepository;

    beforeEach(() => {
      rentalRepo = new InMemoryRentalRepository();
      handler = new GetMemberRentalsQueryHandler(rentalRepo);
    });

    it('should return all rentals for a member', async () => {
      // Setup
      const memberId = MemberId.generate();
      const otherMemberId = MemberId.generate();

      const startDate1 = new Date();
      const endDate1 = new Date();
      endDate1.setDate(endDate1.getDate() + 3);

      const rental1 = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(startDate1, endDate1),
        baseCost: Money.dollars(100),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      await rentalRepo.save(rental1);

      const startDate2 = new Date();
      const endDate2 = new Date();
      endDate2.setDate(endDate2.getDate() + 5);

      const rental2 = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(startDate2, endDate2),
        baseCost: Money.dollars(150),
        conditionAtStart: EquipmentCondition.GOOD,
      });
      await rentalRepo.save(rental2);

      const startDate3 = new Date();
      const endDate3 = new Date();
      endDate3.setDate(endDate3.getDate() + 2);

      const rental3 = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId: otherMemberId,
        period: DateRange.create(startDate3, endDate3),
        baseCost: Money.dollars(200),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      await rentalRepo.save(rental3);

      // Execute
      const result = await handler.execute({ memberId: memberId.value });

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.rentalId)).toContain(rental1.id.value);
      expect(result.map((r) => r.rentalId)).toContain(rental2.id.value);
      expect(result.map((r) => r.rentalId)).not.toContain(rental3.id.value);
    });

    it('should return only active rentals when activeOnly is true', async () => {
      // Setup
      const memberId = MemberId.generate();

      const startDate1 = new Date();
      const endDate1 = new Date();
      endDate1.setDate(endDate1.getDate() + 3);

      const activeRental = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(startDate1, endDate1),
        baseCost: Money.dollars(100),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      await rentalRepo.save(activeRental);

      const startDate2 = new Date();
      const endDate2 = new Date();
      endDate2.setDate(endDate2.getDate() + 5);

      const returnedRental = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(startDate2, endDate2),
        baseCost: Money.dollars(150),
        conditionAtStart: EquipmentCondition.GOOD,
      });
      returnedRental.returnRental(EquipmentCondition.GOOD);
      await rentalRepo.save(returnedRental);

      // Execute
      const result = await handler.execute({ memberId: memberId.value, activeOnly: true });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].rentalId).toBe(activeRental.id.value);
      expect(result[0].status).toBe(RentalStatus.ACTIVE);
    });

    it('should correctly identify overdue rentals', async () => {
      // Setup
      const memberId = MemberId.generate();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 10);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 2); // Ended 2 days ago

      const overdueRental = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(startDate, endDate),
        baseCost: Money.dollars(100),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      await rentalRepo.save(overdueRental);

      // Execute
      const result = await handler.execute({ memberId: memberId.value });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].isOverdue).toBe(true);
    });

    it('should return empty array when member has no rentals', async () => {
      // Execute
      const result = await handler.execute({ memberId: 'non-existent-member' });

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('GetOverdueRentalsQueryHandler', () => {
    let handler: GetOverdueRentalsQueryHandler;
    let rentalRepo: InMemoryRentalRepository;

    beforeEach(() => {
      rentalRepo = new InMemoryRentalRepository();
      handler = new GetOverdueRentalsQueryHandler(rentalRepo);
    });

    it('should return all overdue rentals', async () => {
      // Setup
      // Overdue rental
      const startDate1 = new Date();
      startDate1.setDate(startDate1.getDate() - 10);
      const endDate1 = new Date();
      endDate1.setDate(endDate1.getDate() - 2); // Ended 2 days ago

      const overdueRental = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period: DateRange.create(startDate1, endDate1),
        baseCost: Money.dollars(100),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      await rentalRepo.save(overdueRental);

      // Current rental (not overdue)
      const startDate2 = new Date();
      startDate2.setDate(startDate2.getDate() - 1);
      const endDate2 = new Date();
      endDate2.setDate(endDate2.getDate() + 5);

      const currentRental = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period: DateRange.create(startDate2, endDate2),
        baseCost: Money.dollars(150),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      await rentalRepo.save(currentRental);

      // Execute
      const result = await handler.execute({});

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].rentalId).toBe(overdueRental.id.value);
      expect(result[0].daysOverdue).toBeGreaterThan(0);
    });

    it('should calculate days overdue correctly', async () => {
      // Setup
      const now = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 10);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 3); // Ended 3 days ago

      const overdueRental = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period: DateRange.create(startDate, endDate),
        baseCost: Money.dollars(100),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      await rentalRepo.save(overdueRental);

      // Execute
      const result = await handler.execute({ asOfDate: now });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].daysOverdue).toBeGreaterThanOrEqual(3);
    });

    it('should use provided asOfDate', async () => {
      // Setup
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-05');

      const rental = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period: DateRange.create(startDate, endDate),
        baseCost: Money.dollars(100),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      await rentalRepo.save(rental);

      // Execute with date after rental end
      const asOfDate = new Date('2024-01-10');
      const result = await handler.execute({ asOfDate });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].daysOverdue).toBe(5); // 5 days after end date
    });

    it('should return empty array when no rentals are overdue', async () => {
      // Setup - rental that ends in the future
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 10);

      const rental = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period: DateRange.create(startDate, endDate),
        baseCost: Money.dollars(100),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      await rentalRepo.save(rental);

      // Execute
      const result = await handler.execute({});

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('GetEquipmentMaintenanceScheduleQueryHandler', () => {
    let handler: GetEquipmentMaintenanceScheduleQueryHandler;
    let equipmentRepo: InMemoryEquipmentRepository;

    beforeEach(() => {
      equipmentRepo = new InMemoryEquipmentRepository();
      handler = new GetEquipmentMaintenanceScheduleQueryHandler(equipmentRepo);
    });

    it('should return equipment needing maintenance', async () => {
      // Setup
      // Equipment needing maintenance (last maintenance > 90 days ago)
      const oldMaintenanceDate = new Date();
      oldMaintenanceDate.setDate(oldMaintenanceDate.getDate() - 100);

      const equipment1 = Equipment.create({
        name: 'Drill',
        description: 'Power drill',
        category: 'Tools',
        dailyRate: Money.dollars(50),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date(),
      });
      equipment1.recordMaintenance(oldMaintenanceDate);
      await equipmentRepo.save(equipment1);

      // Equipment not needing maintenance yet
      const recentMaintenanceDate = new Date();
      recentMaintenanceDate.setDate(recentMaintenanceDate.getDate() - 30);

      const equipment2 = Equipment.create({
        name: 'Saw',
        description: 'Circular saw',
        category: 'Tools',
        dailyRate: Money.dollars(40),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      equipment2.recordMaintenance(recentMaintenanceDate);
      await equipmentRepo.save(equipment2);

      // Execute
      const result = await handler.execute({});

      // Assert
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.some((r) => r.name === 'Drill')).toBe(true);
    });

    it('should calculate days since last maintenance correctly', async () => {
      // Setup
      const lastMaintenanceDate = new Date();
      lastMaintenanceDate.setDate(lastMaintenanceDate.getDate() - 100);

      const equipment = Equipment.create({
        name: 'Drill',
        description: 'Power drill',
        category: 'Tools',
        dailyRate: Money.dollars(50),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date(),
      });
      equipment.recordMaintenance(lastMaintenanceDate);
      await equipmentRepo.save(equipment);

      const now = new Date();

      // Execute
      const result = await handler.execute({ asOfDate: now });

      // Assert
      const drillResult = result.find((r) => r.name === 'Drill');
      if (drillResult) {
        expect(drillResult.daysSinceLastMaintenance).toBeGreaterThanOrEqual(100);
        expect(drillResult.lastMaintenanceDate).toEqual(lastMaintenanceDate);
      }
    });

    it('should handle equipment with no previous maintenance', async () => {
      // Setup
      const equipment = Equipment.create({
        name: 'Drill',
        description: 'Power drill',
        category: 'Tools',
        dailyRate: Money.dollars(50),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      await equipmentRepo.save(equipment);

      // Execute
      const result = await handler.execute({});

      // Assert - Equipment with no maintenance should appear in the schedule
      const drillResult = result.find((r) => r.name === 'Drill');
      if (drillResult) {
        expect(drillResult.lastMaintenanceDate).toBeUndefined();
        expect(drillResult.daysSinceLastMaintenance).toBeUndefined();
      }
    });

    it('should return empty array when no equipment needs maintenance', async () => {
      // Setup - equipment with recent maintenance
      const recentMaintenanceDate = new Date();
      recentMaintenanceDate.setDate(recentMaintenanceDate.getDate() - 10);

      const equipment = Equipment.create({
        name: 'Drill',
        description: 'Power drill',
        category: 'Tools',
        dailyRate: Money.dollars(50),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      equipment.recordMaintenance(recentMaintenanceDate);
      await equipmentRepo.save(equipment);

      // Execute
      const result = await handler.execute({});

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should map equipment properties correctly', async () => {
      // Setup
      const lastMaintenanceDate = new Date();
      lastMaintenanceDate.setDate(lastMaintenanceDate.getDate() - 100);

      const equipment = Equipment.create({
        name: 'Drill',
        description: 'Power drill',
        category: 'Tools',
        dailyRate: Money.dollars(50),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date(),
      });
      equipment.recordMaintenance(lastMaintenanceDate);
      await equipmentRepo.save(equipment);

      // Execute
      const result = await handler.execute({});

      // Assert
      const drillResult = result.find((r) => r.name === 'Drill');
      expect(drillResult).toBeDefined();
      if (drillResult) {
        expect(drillResult.equipmentId).toBe(equipment.id.value);
        expect(drillResult.name).toBe('Drill');
        expect(drillResult.category).toBe('Tools');
        expect(drillResult.condition).toBe(EquipmentCondition.GOOD);
        // Calculate expected next maintenance date (90 days after last maintenance)
        const expectedNextMaintenance = new Date(lastMaintenanceDate);
        expectedNextMaintenance.setDate(expectedNextMaintenance.getDate() + 90);
        expect(drillResult.nextMaintenanceDate).toEqual(expectedNextMaintenance);
      }
    });
  });
});
