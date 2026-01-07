/**
 * Integration tests for query handlers using real in-memory adapters
 * Tests the full integration between application layer and adapter layer
 */

import { GetAvailableEquipmentQueryHandler } from '../../GetAvailableEquipmentQuery.js';
import { GetRentalQueryHandler } from '../../GetRentalQuery.js';
import { GetMemberRentalsQueryHandler } from '../../GetMemberRentalsQuery.js';
import { GetOverdueRentalsQueryHandler } from '../../GetOverdueRentalsQuery.js';
import { GetEquipmentMaintenanceScheduleQueryHandler } from '../../GetEquipmentMaintenanceScheduleQuery.js';

// Use actual in-memory adapters
import { InMemoryEquipmentRepository } from '../../../../adapters/outbound/persistence/InMemoryEquipmentRepository.js';
import { InMemoryRentalRepository } from '../../../../adapters/outbound/persistence/InMemoryRentalRepository.js';

// Domain entities and value objects
import { Equipment } from '../../../../domain/entities/Equipment.js';
import { Rental } from '../../../../domain/entities/Rental.js';
import { Money } from '../../../../domain/value-objects/Money.js';
import { DateRange } from '../../../../domain/value-objects/DateRange.js';
import { EquipmentId, MemberId } from '../../../../domain/value-objects/identifiers.js';
import { EquipmentCondition } from '../../../../domain/types/EquipmentCondition.js';
import { RentalStatus } from '../../../../domain/types/RentalStatus.js';

describe('Query Handlers Integration Tests', () => {
  let equipmentRepo: InMemoryEquipmentRepository;
  let rentalRepo: InMemoryRentalRepository;

  beforeEach(() => {
    // Create fresh instances of all adapters
    equipmentRepo = new InMemoryEquipmentRepository();
    rentalRepo = new InMemoryRentalRepository();
  });

  describe('GetAvailableEquipmentQueryHandler Integration', () => {
    let handler: GetAvailableEquipmentQueryHandler;

    beforeEach(() => {
      handler = new GetAvailableEquipmentQueryHandler(equipmentRepo);
    });

    it('should retrieve all available equipment from repository', async () => {
      // Setup - create multiple equipment items
      const drill = Equipment.create({
        name: 'Power Drill',
        description: 'Professional drill',
        category: 'Tools',
        dailyRate: Money.dollars(50),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      await equipmentRepo.save(drill);

      const saw = Equipment.create({
        name: 'Circular Saw',
        description: 'Heavy duty saw',
        category: 'Tools',
        dailyRate: Money.dollars(60),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date(),
      });
      await equipmentRepo.save(saw);

      const ladder = Equipment.create({
        name: 'Extension Ladder',
        description: '20ft ladder',
        category: 'Access',
        dailyRate: Money.dollars(30),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      ladder.markAsRented('rental-123'); // Not available
      await equipmentRepo.save(ladder);

      const excavator = Equipment.create({
        name: 'Mini Excavator',
        description: 'Compact excavator',
        category: 'Heavy Machinery',
        dailyRate: Money.dollars(500),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date(),
      });
      await equipmentRepo.save(excavator);

      // Execute - get all available
      const result = await handler.execute({});

      // Verify - should return 3 available items (excluding rented ladder)
      expect(result).toHaveLength(3);
      expect(result.map((e) => e.name)).toContain('Power Drill');
      expect(result.map((e) => e.name)).toContain('Circular Saw');
      expect(result.map((e) => e.name)).toContain('Mini Excavator');
      expect(result.map((e) => e.name)).not.toContain('Extension Ladder');
    });

    it('should filter available equipment by category', async () => {
      // Setup
      const drill = Equipment.create({
        name: 'Power Drill',
        description: 'Professional drill',
        category: 'Tools',
        dailyRate: Money.dollars(50),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      await equipmentRepo.save(drill);

      const saw = Equipment.create({
        name: 'Circular Saw',
        description: 'Heavy duty saw',
        category: 'Tools',
        dailyRate: Money.dollars(60),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date(),
      });
      await equipmentRepo.save(saw);

      const excavator = Equipment.create({
        name: 'Mini Excavator',
        description: 'Compact excavator',
        category: 'Heavy Machinery',
        dailyRate: Money.dollars(500),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date(),
      });
      await equipmentRepo.save(excavator);

      // Execute - filter by Tools category
      const result = await handler.execute({ category: 'Tools' });

      // Verify
      expect(result).toHaveLength(2);
      expect(result.every((e) => e.category === 'Tools')).toBe(true);
      expect(result.map((e) => e.name)).toContain('Power Drill');
      expect(result.map((e) => e.name)).toContain('Circular Saw');
    });

    it('should map equipment properties correctly', async () => {
      const equipment = Equipment.create({
        name: 'Power Drill',
        description: 'Professional grade drill',
        category: 'Tools',
        dailyRate: Money.dollars(75),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      await equipmentRepo.save(equipment);

      const result = await handler.execute({});

      expect(result).toHaveLength(1);
      expect(result[0].equipmentId).toBe(equipment.id.value);
      expect(result[0].name).toBe('Power Drill');
      expect(result[0].description).toBe('Professional grade drill');
      expect(result[0].category).toBe('Tools');
      expect(result[0].dailyRate).toBe(75);
      expect(result[0].condition).toBe(EquipmentCondition.EXCELLENT);
    });

    it('should return empty array when no equipment is available', async () => {
      // Execute without adding any equipment
      const result = await handler.execute({});

      // Verify
      expect(result).toHaveLength(0);
    });
  });

  describe('GetRentalQueryHandler Integration', () => {
    let handler: GetRentalQueryHandler;

    beforeEach(() => {
      handler = new GetRentalQueryHandler(rentalRepo);
    });

    it('should retrieve rental by ID from repository', async () => {
      // Setup
      const equipmentId = EquipmentId.generate();
      const memberId = MemberId.generate();
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-05');

      const rental = Rental.create({
        equipmentId,
        memberId,
        period: DateRange.create(startDate, endDate),
        baseCost: Money.dollars(200),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      await rentalRepo.save(rental);

      // Execute
      const result = await handler.execute({ rentalId: rental.id.value });

      // Verify
      expect(result).toBeDefined();
      expect(result!.rentalId).toBe(rental.id.value);
      expect(result!.equipmentId).toBe(equipmentId.value);
      expect(result!.memberId).toBe(memberId.value);
      expect(result!.status).toBe(RentalStatus.ACTIVE);
      expect(result!.totalCost).toBe(200);
      expect(result!.conditionAtStart).toBe(EquipmentCondition.EXCELLENT);
      expect(result!.startDate).toEqual(startDate);
      expect(result!.endDate).toEqual(endDate);
    });

    it('should return undefined when rental does not exist', async () => {
      // Execute
      const result = await handler.execute({ rentalId: 'non-existent-id' });

      // Verify
      expect(result).toBeUndefined();
    });

    it('should include return details for returned rental', async () => {
      const equipmentId = EquipmentId.generate();
      const memberId = MemberId.generate();
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-05');

      const rental = Rental.create({
        equipmentId,
        memberId,
        period: DateRange.create(startDate, endDate),
        baseCost: Money.dollars(200),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });

      const returnDate = new Date('2024-01-08'); // Late return
      rental.returnRental(EquipmentCondition.GOOD, Money.dollars(30), returnDate);
      await rentalRepo.save(rental);

      // Execute
      const result = await handler.execute({ rentalId: rental.id.value });

      // Verify
      expect(result).toBeDefined();
      expect(result!.status).toBe(RentalStatus.RETURNED);
      expect(result!.conditionAtReturn).toBe(EquipmentCondition.GOOD);
      expect(result!.actualReturnDate).toEqual(returnDate);
      expect(result!.lateFee).toBe(30);
    });
  });

  describe('GetMemberRentalsQueryHandler Integration', () => {
    let handler: GetMemberRentalsQueryHandler;

    beforeEach(() => {
      handler = new GetMemberRentalsQueryHandler(rentalRepo);
    });

    it('should retrieve all rentals for a specific member', async () => {
      const memberId = MemberId.generate();
      const otherMemberId = MemberId.generate();

      // Create rentals for target member
      const rental1 = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(new Date('2024-01-01'), new Date('2024-01-05')),
        baseCost: Money.dollars(100),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      await rentalRepo.save(rental1);

      const rental2 = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(new Date('2024-01-10'), new Date('2024-01-15')),
        baseCost: Money.dollars(150),
        conditionAtStart: EquipmentCondition.GOOD,
      });
      await rentalRepo.save(rental2);

      // Create rental for different member
      const rental3 = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId: otherMemberId,
        period: DateRange.create(new Date('2024-01-01'), new Date('2024-01-03')),
        baseCost: Money.dollars(75),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      await rentalRepo.save(rental3);

      // Execute
      const result = await handler.execute({ memberId: memberId.value });

      // Verify - should only return rentals for target member
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.rentalId)).toContain(rental1.id.value);
      expect(result.map((r) => r.rentalId)).toContain(rental2.id.value);
      expect(result.map((r) => r.rentalId)).not.toContain(rental3.id.value);
    });

    it('should filter to active rentals only when activeOnly is true', async () => {
      const memberId = MemberId.generate();

      // Create active rental
      const activeRental = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(new Date('2024-01-01'), new Date('2024-01-05')),
        baseCost: Money.dollars(100),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      await rentalRepo.save(activeRental);

      // Create returned rental
      const returnedRental = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(new Date('2024-01-10'), new Date('2024-01-15')),
        baseCost: Money.dollars(150),
        conditionAtStart: EquipmentCondition.GOOD,
      });
      returnedRental.returnRental(EquipmentCondition.GOOD);
      await rentalRepo.save(returnedRental);

      // Execute with activeOnly filter
      const result = await handler.execute({ memberId: memberId.value, activeOnly: true });

      // Verify - should only return active rental
      expect(result).toHaveLength(1);
      expect(result[0].rentalId).toBe(activeRental.id.value);
      expect(result[0].status).toBe(RentalStatus.ACTIVE);
    });

    it('should correctly identify overdue rentals', async () => {
      const memberId = MemberId.generate();

      // Create overdue rental
      const overdueRental = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(new Date('2020-01-01'), new Date('2020-01-05')),
        baseCost: Money.dollars(100),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      await rentalRepo.save(overdueRental);

      // Execute
      const result = await handler.execute({ memberId: memberId.value });

      // Verify
      expect(result).toHaveLength(1);
      expect(result[0].isOverdue).toBe(true);
    });

    it('should return empty array when member has no rentals', async () => {
      // Execute with non-existent member ID
      const result = await handler.execute({ memberId: 'non-existent-member' });

      // Verify
      expect(result).toHaveLength(0);
    });
  });

  describe('GetOverdueRentalsQueryHandler Integration', () => {
    let handler: GetOverdueRentalsQueryHandler;

    beforeEach(() => {
      handler = new GetOverdueRentalsQueryHandler(rentalRepo);
    });

    it('should retrieve all overdue rentals from repository', async () => {
      // Create overdue rental
      const overdueRental = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period: DateRange.create(new Date('2020-01-01'), new Date('2020-01-05')),
        baseCost: Money.dollars(100),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      await rentalRepo.save(overdueRental);

      // Create current rental (not overdue)
      const currentRental = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period: DateRange.create(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        baseCost: Money.dollars(150),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      await rentalRepo.save(currentRental);

      // Create returned rental
      const returnedRental = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period: DateRange.create(new Date('2020-02-01'), new Date('2020-02-05')),
        baseCost: Money.dollars(200),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      returnedRental.returnRental(EquipmentCondition.GOOD);
      await rentalRepo.save(returnedRental);

      // Execute
      const result = await handler.execute({});

      // Verify - should only return overdue rental
      expect(result).toHaveLength(1);
      expect(result[0].rentalId).toBe(overdueRental.id.value);
      expect(result[0].daysOverdue).toBeGreaterThan(0);
    });

    it('should calculate days overdue correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-05');

      const overdueRental = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period: DateRange.create(startDate, endDate),
        baseCost: Money.dollars(100),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      await rentalRepo.save(overdueRental);

      // Execute with specific date
      const asOfDate = new Date('2024-01-10');
      const result = await handler.execute({ asOfDate });

      // Verify - should be 5 days overdue (Jan 10 - Jan 5 = 5 days)
      expect(result).toHaveLength(1);
      expect(result[0].daysOverdue).toBe(5);
    });

    it('should use provided asOfDate parameter', async () => {
      const rental = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period: DateRange.create(new Date('2024-01-01'), new Date('2024-01-05')),
        baseCost: Money.dollars(100),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      await rentalRepo.save(rental);

      // Execute with date before rental end - should not be overdue
      const beforeEndDate = new Date('2024-01-03');
      const result1 = await handler.execute({ asOfDate: beforeEndDate });
      expect(result1).toHaveLength(0);

      // Execute with date after rental end - should be overdue
      const afterEndDate = new Date('2024-01-10');
      const result2 = await handler.execute({ asOfDate: afterEndDate });
      expect(result2).toHaveLength(1);
      expect(result2[0].daysOverdue).toBe(5);
    });

    it('should return empty array when no rentals are overdue', async () => {
      // Create future rental
      const futureRental = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period: DateRange.create(new Date(), new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)),
        baseCost: Money.dollars(100),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      await rentalRepo.save(futureRental);

      // Execute
      const result = await handler.execute({});

      // Verify
      expect(result).toHaveLength(0);
    });
  });

  describe('GetEquipmentMaintenanceScheduleQueryHandler Integration', () => {
    let handler: GetEquipmentMaintenanceScheduleQueryHandler;

    beforeEach(() => {
      handler = new GetEquipmentMaintenanceScheduleQueryHandler(equipmentRepo);
    });

    it('should retrieve equipment needing maintenance from repository', async () => {
      // Equipment needing maintenance (last maintenance > 90 days ago)
      const oldMaintenanceDate = new Date();
      oldMaintenanceDate.setDate(oldMaintenanceDate.getDate() - 100);

      const needsMaintenance = Equipment.create({
        name: 'Old Drill',
        description: 'Drill needing maintenance',
        category: 'Tools',
        dailyRate: Money.dollars(50),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date(),
      });
      needsMaintenance.recordMaintenance(oldMaintenanceDate);
      await equipmentRepo.save(needsMaintenance);

      // Equipment not needing maintenance yet
      const recentMaintenanceDate = new Date();
      recentMaintenanceDate.setDate(recentMaintenanceDate.getDate() - 30);

      const doesNotNeedMaintenance = Equipment.create({
        name: 'New Saw',
        description: 'Recently maintained saw',
        category: 'Tools',
        dailyRate: Money.dollars(60),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      doesNotNeedMaintenance.recordMaintenance(recentMaintenanceDate);
      await equipmentRepo.save(doesNotNeedMaintenance);

      // Execute
      const result = await handler.execute({});

      // Verify
      expect(result.length).toBeGreaterThanOrEqual(1);
      const drillResult = result.find((e) => e.name === 'Old Drill');
      expect(drillResult).toBeDefined();
      expect(drillResult!.daysSinceLastMaintenance).toBeGreaterThanOrEqual(100);
    });

    it('should calculate maintenance schedule correctly', async () => {
      const lastMaintenanceDate = new Date();
      lastMaintenanceDate.setDate(lastMaintenanceDate.getDate() - 95);

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
      const result = await handler.execute({ asOfDate: now });

      const drillResult = result.find((e) => e.name === 'Drill');
      expect(drillResult).toBeDefined();
      if (drillResult) {
        expect(drillResult.lastMaintenanceDate).toEqual(lastMaintenanceDate);
        expect(drillResult.daysSinceLastMaintenance).toBeGreaterThanOrEqual(95);

        // Next maintenance should be 90 days after last maintenance
        const expectedNextMaintenance = new Date(lastMaintenanceDate);
        expectedNextMaintenance.setDate(expectedNextMaintenance.getDate() + 90);
        expect(drillResult.nextMaintenanceDate).toEqual(expectedNextMaintenance);
      }
    });

    it('should handle equipment with no previous maintenance', async () => {
      const equipment = Equipment.create({
        name: 'Brand New Equipment',
        description: 'Never maintained',
        category: 'Tools',
        dailyRate: Money.dollars(50),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      await equipmentRepo.save(equipment);

      const result = await handler.execute({});

      const newEquipmentResult = result.find((e) => e.name === 'Brand New Equipment');
      if (newEquipmentResult) {
        expect(newEquipmentResult.lastMaintenanceDate).toBeUndefined();
        expect(newEquipmentResult.daysSinceLastMaintenance).toBeUndefined();
      }
    });

    it('should return empty array when no equipment needs maintenance', async () => {
      const recentMaintenanceDate = new Date();
      recentMaintenanceDate.setDate(recentMaintenanceDate.getDate() - 10);

      const equipment = Equipment.create({
        name: 'Well Maintained Drill',
        description: 'Recently maintained',
        category: 'Tools',
        dailyRate: Money.dollars(50),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      equipment.recordMaintenance(recentMaintenanceDate);
      await equipmentRepo.save(equipment);

      const result = await handler.execute({});

      expect(result).toHaveLength(0);
    });

    it('should map all equipment properties correctly', async () => {
      const lastMaintenanceDate = new Date();
      lastMaintenanceDate.setDate(lastMaintenanceDate.getDate() - 100);

      const equipment = Equipment.create({
        name: 'Test Equipment',
        description: 'Test description',
        category: 'Tools',
        dailyRate: Money.dollars(75),
        condition: EquipmentCondition.GOOD,
        purchaseDate: new Date(),
      });
      equipment.recordMaintenance(lastMaintenanceDate);
      await equipmentRepo.save(equipment);

      const result = await handler.execute({});

      const testResult = result.find((e) => e.name === 'Test Equipment');
      expect(testResult).toBeDefined();
      if (testResult) {
        expect(testResult.equipmentId).toBe(equipment.id.value);
        expect(testResult.name).toBe('Test Equipment');
        expect(testResult.category).toBe('Tools');
        expect(testResult.condition).toBe(EquipmentCondition.GOOD);
        expect(testResult.lastMaintenanceDate).toEqual(lastMaintenanceDate);
      }
    });
  });
});
