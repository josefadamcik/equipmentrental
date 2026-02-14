import { Rental } from '../Rental.js';
import { EquipmentId, MemberId } from '../../value-objects/identifiers.js';
import { Money } from '../../value-objects/Money.js';
import { DateRange } from '../../value-objects/DateRange.js';
import { RentalStatus } from '../../types/RentalStatus.js';
import { EquipmentCondition } from '../../types/EquipmentCondition.js';

describe('Rental Entity', () => {
  const createRental = () => {
    const start = new Date('2024-06-01');
    const end = new Date('2024-06-08');
    return Rental.create({
      equipmentId: EquipmentId.generate(),
      memberId: MemberId.generate(),
      period: DateRange.create(start, end),
      baseCost: Money.dollars(175),
      conditionAtStart: EquipmentCondition.EXCELLENT,
    });
  };

  describe('create', () => {
    it('should create rental with valid properties', () => {
      const rental = createRental();

      expect(rental.status).toBe(RentalStatus.ACTIVE);
      expect(rental.baseCost.equals(Money.dollars(175))).toBe(true);
      expect(rental.totalCost.equals(Money.dollars(175))).toBe(true);
      expect(rental.lateFee.equals(Money.zero())).toBe(true);
      expect(rental.conditionAtStart).toBe(EquipmentCondition.EXCELLENT);
    });

    it('should allow zero base cost for promotional rentals', () => {
      const start = new Date('2024-06-01');
      const end = new Date('2024-06-08');

      const rental = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period: DateRange.create(start, end),
        baseCost: Money.zero(),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });

      expect(rental.baseCost.equals(Money.zero())).toBe(true);
      expect(rental.totalCost.equals(Money.zero())).toBe(true);
    });
  });

  describe('isOverdue', () => {
    it('should return true if active rental has ended', () => {
      const rental = createRental();
      const now = new Date('2024-06-10'); // After end date

      expect(rental.isOverdue(now)).toBe(true);
    });

    it('should return false if rental has not ended', () => {
      const rental = createRental();
      const now = new Date('2024-06-05'); // Before end date

      expect(rental.isOverdue(now)).toBe(false);
    });

    it('should return false if rental is not active', () => {
      const rental = createRental();
      rental.returnRental(EquipmentCondition.GOOD);

      const now = new Date('2024-06-10');
      expect(rental.isOverdue(now)).toBe(false);
    });
  });

  describe('markAsOverdue', () => {
    it('should mark active rental as overdue and calculate late fees', () => {
      const rental = createRental();
      const now = new Date('2024-06-10'); // 2 days late
      const dailyLateFeeRate = Money.dollars(10);

      rental.markAsOverdue(dailyLateFeeRate, now);

      expect(rental.status).toBe(RentalStatus.OVERDUE);
      expect(rental.lateFee.equals(Money.dollars(20))).toBe(true);
      expect(rental.totalCost.equals(Money.dollars(195))).toBe(true);
    });

    it('should throw error if rental is not active', () => {
      const rental = createRental();
      rental.returnRental(EquipmentCondition.GOOD);

      expect(() => rental.markAsOverdue(Money.dollars(10))).toThrow(
        'Only active rentals can be marked as overdue',
      );
    });

    it('should throw error if rental period has not ended', () => {
      const rental = createRental();
      const now = new Date('2024-06-05');

      expect(() => rental.markAsOverdue(Money.dollars(10), now)).toThrow(
        'Rental period has not ended yet',
      );
    });
  });

  describe('returnRental', () => {
    it('should return active rental on time', () => {
      const rental = createRental();
      const now = new Date('2024-06-07'); // Before end date

      rental.returnRental(EquipmentCondition.GOOD, Money.zero(), now);

      expect(rental.status).toBe(RentalStatus.RETURNED);
      expect(rental.conditionAtReturn).toBe(EquipmentCondition.GOOD);
      expect(rental.returnedAt).toEqual(now);
      expect(rental.lateFee.equals(Money.zero())).toBe(true);
    });

    it('should calculate late fees when returned late', () => {
      const rental = createRental();
      const now = new Date('2024-06-10'); // 2 days late

      rental.returnRental(EquipmentCondition.GOOD, Money.zero(), now);

      expect(rental.status).toBe(RentalStatus.RETURNED);
      expect(rental.lateFee.equals(Money.dollars(20))).toBe(true); // 2 days * $10/day
    });

    it('should add damage fee to total cost', () => {
      const rental = createRental();
      const now = new Date('2024-06-07');
      const damageFee = Money.dollars(50);

      rental.returnRental(EquipmentCondition.FAIR, damageFee, now);

      expect(rental.totalCost.equals(Money.dollars(225))).toBe(true); // 175 + 50
    });

    it('should return overdue rental', () => {
      const rental = createRental();
      const overdueDate = new Date('2024-06-10');

      rental.markAsOverdue(Money.dollars(10), overdueDate);
      rental.returnRental(EquipmentCondition.GOOD);

      expect(rental.status).toBe(RentalStatus.RETURNED);
    });

    it('should throw error if rental is already returned', () => {
      const rental = createRental();
      rental.returnRental(EquipmentCondition.GOOD);

      expect(() => rental.returnRental(EquipmentCondition.GOOD)).toThrow(
        'already been returned',
      );
    });
  });

  describe('extendPeriod', () => {
    it('should extend active rental period', () => {
      const rental = createRental();

      rental.extendPeriod(3, Money.dollars(75));

      expect(rental.getDurationDays()).toBe(10); // 7 + 3 days
      expect(rental.baseCost.equals(Money.dollars(250))).toBe(true); // 175 + 75
      expect(rental.totalCost.equals(Money.dollars(250))).toBe(true);
    });

    it('should revert overdue status when extended', () => {
      const rental = createRental();
      const overdueDate = new Date('2024-06-10');

      rental.markAsOverdue(Money.dollars(10), overdueDate);
      rental.extendPeriod(5, Money.dollars(125));

      expect(rental.status).toBe(RentalStatus.ACTIVE);
      expect(rental.lateFee.equals(Money.zero())).toBe(true);
      expect(rental.totalCost.equals(Money.dollars(300))).toBe(true); // 175 + 125
    });

    it('should throw error for non-positive extension days', () => {
      const rental = createRental();

      expect(() => rental.extendPeriod(0, Money.dollars(0))).toThrow(
        'Extension days must be positive',
      );
    });

    it('should throw error for negative additional cost', () => {
      const rental = createRental();

      expect(() => rental.extendPeriod(3, Money.dollars(-10))).toThrow(
        'Money amount cannot be negative',
      );
    });

    it('should throw error if rental is returned', () => {
      const rental = createRental();
      rental.returnRental(EquipmentCondition.GOOD);

      expect(() => rental.extendPeriod(3, Money.dollars(75))).toThrow(
        'Rental is not active or overdue',
      );
    });
  });

  describe('cancel', () => {
    it('should cancel active rental', () => {
      const rental = createRental();

      rental.cancel();

      expect(rental.status).toBe(RentalStatus.CANCELLED);
      expect(rental.totalCost.equals(Money.zero())).toBe(true);
    });

    it('should throw error if rental is already returned', () => {
      const rental = createRental();
      rental.returnRental(EquipmentCondition.GOOD);

      expect(() => rental.cancel()).toThrow('Cannot cancel a completed rental');
    });

    it('should throw error if rental is already cancelled', () => {
      const rental = createRental();
      rental.cancel();

      expect(() => rental.cancel()).toThrow('Cannot cancel a completed rental');
    });
  });

  describe('getDurationDays', () => {
    it('should return correct number of days', () => {
      const rental = createRental();

      expect(rental.getDurationDays()).toBe(7);
    });
  });

  describe('calculateDamageFee', () => {
    it('should return zero if no degradation', () => {
      const rental = createRental();

      const fee = rental.calculateDamageFee(EquipmentCondition.EXCELLENT);
      expect(fee.equals(Money.zero())).toBe(true);
    });

    it('should return zero if condition improved', () => {
      const start = new Date('2024-06-01');
      const end = new Date('2024-06-08');
      const rental = Rental.create({
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period: DateRange.create(start, end),
        baseCost: Money.dollars(175),
        conditionAtStart: EquipmentCondition.GOOD,
      });

      const fee = rental.calculateDamageFee(EquipmentCondition.EXCELLENT);
      expect(fee.equals(Money.zero())).toBe(true);
    });

    it('should not charge fee for one level degradation (acceptable wear)', () => {
      const rental = createRental();

      const fee = rental.calculateDamageFee(EquipmentCondition.GOOD);
      expect(fee.equals(Money.zero())).toBe(true);
    });

    it('should calculate fee for two level degradation', () => {
      const rental = createRental();

      const fee = rental.calculateDamageFee(EquipmentCondition.FAIR);
      expect(fee.equals(Money.dollars(50))).toBe(true);
    });

    it('should calculate fee for severe degradation', () => {
      const rental = createRental();

      const fee = rental.calculateDamageFee(EquipmentCondition.DAMAGED);
      expect(fee.equals(Money.dollars(150))).toBe(true); // 3 levels - 1 = 2, 2 * $50 = $150
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute rental from snapshot', () => {
      const rental = createRental();
      const snapshot = rental.toSnapshot();

      const reconstituted = Rental.reconstitute(snapshot);

      expect(reconstituted.id.equals(rental.id)).toBe(true);
      expect(reconstituted.status).toBe(rental.status);
      expect(reconstituted.baseCost.equals(rental.baseCost)).toBe(true);
    });
  });
});
