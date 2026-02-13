import { InMemoryRentalRepository } from '../InMemoryRentalRepository.js';
import { Rental } from '../../../../domain/entities/Rental.js';
import { RentalId, EquipmentId, MemberId } from '../../../../domain/value-objects/identifiers.js';
import { Money } from '../../../../domain/value-objects/Money.js';
import { DateRange } from '../../../../domain/value-objects/DateRange.js';
import { RentalStatus } from '../../../../domain/types/RentalStatus.js';
import { EquipmentCondition } from '../../../../domain/types/EquipmentCondition.js';

describe('InMemoryRentalRepository', () => {
  let repository: InMemoryRentalRepository;

  beforeEach(() => {
    repository = new InMemoryRentalRepository();
  });

  const createRental = (daysOffset = 0, daysLength = 7): Rental => {
    const start = new Date();
    start.setDate(start.getDate() + daysOffset);
    const end = new Date(start);
    end.setDate(end.getDate() + daysLength);

    return Rental.create({
      equipmentId: EquipmentId.generate(),
      memberId: MemberId.generate(),
      period: DateRange.create(start, end),
      baseCost: Money.dollars(100),
      conditionAtStart: EquipmentCondition.GOOD,
    });
  };

  describe('save and findById', () => {
    it('should save and retrieve rental by id', async () => {
      const rental = createRental();
      await repository.save(rental);

      const found = await repository.findById(rental.id);
      expect(found).toBeDefined();
      expect(found?.id.value).toBe(rental.id.value);
    });

    it('should return undefined for non-existent id', async () => {
      const id = RentalId.generate();
      const found = await repository.findById(id);
      expect(found).toBeUndefined();
    });
  });

  describe('findByMemberId', () => {
    it('should return all rentals for a member', async () => {
      const memberId = MemberId.generate();

      const rental1 = createRental();
      const rental2 = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(new Date(), new Date(Date.now() + 86400000)),
        baseCost: Money.dollars(50),
        conditionAtStart: EquipmentCondition.GOOD,
      });

      await repository.save(rental1);
      await repository.save(rental2);

      const rentals = await repository.findByMemberId(memberId);
      expect(rentals).toHaveLength(1);
      expect(rentals[0].id.value).toBe(rental2.id.value);
    });
  });

  describe('findByEquipmentId', () => {
    it('should return all rentals for equipment', async () => {
      const equipmentId = EquipmentId.generate();

      const rental1 = createRental();
      const rental2 = Rental.create({
        equipmentId,
        memberId: MemberId.generate(),
        period: DateRange.create(new Date(), new Date(Date.now() + 86400000)),
        baseCost: Money.dollars(50),
        conditionAtStart: EquipmentCondition.GOOD,
      });

      await repository.save(rental1);
      await repository.save(rental2);

      const rentals = await repository.findByEquipmentId(equipmentId);
      expect(rentals).toHaveLength(1);
      expect(rentals[0].id.value).toBe(rental2.id.value);
    });
  });

  describe('findByStatus', () => {
    it('should return rentals by status', async () => {
      const active = createRental(0, 7);
      const returned = createRental(-14, 7);
      returned.returnRental(EquipmentCondition.GOOD);

      await repository.save(active);
      await repository.save(returned);

      const activeRentals = await repository.findByStatus(RentalStatus.ACTIVE);
      expect(activeRentals).toHaveLength(1);
      expect(activeRentals[0].status).toBe(RentalStatus.ACTIVE);

      const returnedRentals = await repository.findByStatus(RentalStatus.RETURNED);
      expect(returnedRentals).toHaveLength(1);
      expect(returnedRentals[0].status).toBe(RentalStatus.RETURNED);
    });
  });

  describe('findActive', () => {
    it('should return active and overdue rentals', async () => {
      const active = createRental(0, 7);
      const overdue = createRental(-10, 5);
      overdue.markAsOverdue(Money.dollars(10));
      const returned = createRental(-14, 7);
      returned.returnRental(EquipmentCondition.GOOD);

      await repository.save(active);
      await repository.save(overdue);
      await repository.save(returned);

      const activeRentals = await repository.findActive();
      expect(activeRentals).toHaveLength(2);
    });
  });

  describe('findActiveByMemberId', () => {
    it('should return active rentals for member', async () => {
      const memberId = MemberId.generate();

      const activeForMember = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(new Date(), new Date(Date.now() + 86400000)),
        baseCost: Money.dollars(50),
        conditionAtStart: EquipmentCondition.GOOD,
      });

      const returnedForMember = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(new Date(), new Date(Date.now() + 86400000)),
        baseCost: Money.dollars(50),
        conditionAtStart: EquipmentCondition.GOOD,
      });
      returnedForMember.returnRental(EquipmentCondition.GOOD);

      const activeForOther = createRental();

      await repository.save(activeForMember);
      await repository.save(returnedForMember);
      await repository.save(activeForOther);

      const rentals = await repository.findActiveByMemberId(memberId);
      expect(rentals).toHaveLength(1);
      expect(rentals[0].id.value).toBe(activeForMember.id.value);
    });
  });

  describe('findActiveByEquipmentId', () => {
    it('should return active rental for equipment', async () => {
      const equipmentId = EquipmentId.generate();

      const activeRental = Rental.create({
        equipmentId,
        memberId: MemberId.generate(),
        period: DateRange.create(new Date(), new Date(Date.now() + 86400000)),
        baseCost: Money.dollars(50),
        conditionAtStart: EquipmentCondition.GOOD,
      });

      await repository.save(activeRental);

      const found = await repository.findActiveByEquipmentId(equipmentId);
      expect(found).toBeDefined();
      expect(found?.id.value).toBe(activeRental.id.value);
    });

    it('should return undefined if no active rental exists', async () => {
      const equipmentId = EquipmentId.generate();
      const found = await repository.findActiveByEquipmentId(equipmentId);
      expect(found).toBeUndefined();
    });
  });

  describe('findOverdue', () => {
    it('should return overdue rentals', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const overdue = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period: DateRange.create(weekAgo, yesterday),
        baseCost: Money.dollars(100),
        conditionAtStart: EquipmentCondition.GOOD,
      });

      const notOverdue = createRental(0, 7);

      await repository.save(overdue);
      await repository.save(notOverdue);

      const overdueRentals = await repository.findOverdue();
      expect(overdueRentals).toHaveLength(1);
      expect(overdueRentals[0].id.value).toBe(overdue.id.value);
    });
  });

  describe('findEndingInPeriod', () => {
    it('should return rentals ending in period', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const endingInPeriod = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period: DateRange.create(new Date(), dayAfterTomorrow),
        baseCost: Money.dollars(50),
        conditionAtStart: EquipmentCondition.GOOD,
      });

      const endingLater = createRental(0, 10);

      await repository.save(endingInPeriod);
      await repository.save(endingLater);

      const period = DateRange.create(tomorrow, nextWeek);
      const rentals = await repository.findEndingInPeriod(period);
      expect(rentals).toHaveLength(1);
      expect(rentals[0].id.value).toBe(endingInPeriod.id.value);
    });
  });

  describe('findByCreatedDateRange', () => {
    it('should return rentals created in date range', async () => {
      const rental = createRental();
      await repository.save(rental);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const rentals = await repository.findByCreatedDateRange(yesterday, tomorrow);
      expect(rentals).toHaveLength(1);
    });
  });

  describe('findByReturnedDateRange', () => {
    it('should return rentals returned in date range', async () => {
      const rental = createRental();
      const now = new Date();
      rental.returnRental(EquipmentCondition.GOOD, Money.zero(), now);

      await repository.save(rental);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const rentals = await repository.findByReturnedDateRange(yesterday, tomorrow);
      expect(rentals).toHaveLength(1);
    });

    it('should not return non-returned rentals', async () => {
      const rental = createRental();
      await repository.save(rental);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const rentals = await repository.findByReturnedDateRange(yesterday, tomorrow);
      expect(rentals).toHaveLength(0);
    });
  });

  describe('count methods', () => {
    beforeEach(async () => {
      const active = createRental(0, 7);
      const returned = createRental(-14, 7);
      returned.returnRental(EquipmentCondition.GOOD);
      const cancelled = createRental(0, 7);
      cancelled.cancel();

      await repository.save(active);
      await repository.save(returned);
      await repository.save(cancelled);
    });

    it('should count total rentals', async () => {
      expect(await repository.count()).toBe(3);
    });

    it('should count by status', async () => {
      expect(await repository.countByStatus(RentalStatus.ACTIVE)).toBe(1);
      expect(await repository.countByStatus(RentalStatus.RETURNED)).toBe(1);
      expect(await repository.countByStatus(RentalStatus.CANCELLED)).toBe(1);
    });

    it('should count active rentals by member', async () => {
      const memberId = MemberId.generate();

      const rental1 = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(new Date(), new Date(Date.now() + 86400000)),
        baseCost: Money.dollars(50),
        conditionAtStart: EquipmentCondition.GOOD,
      });

      const rental2 = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(new Date(), new Date(Date.now() + 86400000)),
        baseCost: Money.dollars(50),
        conditionAtStart: EquipmentCondition.GOOD,
      });
      rental2.returnRental(EquipmentCondition.GOOD);

      await repository.save(rental1);
      await repository.save(rental2);

      const count = await repository.countActiveByMemberId(memberId);
      expect(count).toBe(1);
    });
  });

  describe('exists and delete', () => {
    it('should check existence and delete rental', async () => {
      const rental = createRental();
      await repository.save(rental);

      expect(await repository.exists(rental.id)).toBe(true);

      await repository.delete(rental.id);

      expect(await repository.exists(rental.id)).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all rentals', async () => {
      const rental = createRental();
      await repository.save(rental);

      expect(await repository.count()).toBe(1);

      repository.clear();
      expect(await repository.count()).toBe(0);
    });
  });

  describe('data isolation', () => {
    it('should return clones to prevent external mutations', async () => {
      const rental = createRental();
      await repository.save(rental);

      const found1 = await repository.findById(rental.id);
      const found2 = await repository.findById(rental.id);

      // Modifying one shouldn't affect the other
      found1?.extendPeriod(3, Money.dollars(30));

      expect(found2?.getDurationDays()).toBe(7);

      // Also shouldn't affect what's in the repository
      const found3 = await repository.findById(rental.id);
      expect(found3?.getDurationDays()).toBe(7);
    });
  });
});
