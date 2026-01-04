import { describe, it, expect, beforeEach } from '@jest/globals';
import { RentalCreated, RentalReturned, RentalOverdue } from '../RentalEvents';
import { RentalId, MemberId, EquipmentId } from '../../value-objects/identifiers';
import { Money } from '../../value-objects/Money';
import { DateRange } from '../../value-objects/DateRange';

describe('RentalEvents', () => {
  let rentalId: RentalId;
  let memberId: MemberId;
  let equipmentId: EquipmentId;
  let period: DateRange;
  let dailyRate: Money;

  beforeEach(() => {
    rentalId = RentalId.generate();
    memberId = MemberId.generate();
    equipmentId = EquipmentId.generate();
    period = DateRange.create(new Date('2024-01-01'), new Date('2024-01-05'));
    dailyRate = Money.dollars(50);
  });

  describe('RentalCreated', () => {
    it('should create event with correct properties', () => {
      const event = RentalCreated.create(
        rentalId,
        memberId,
        equipmentId,
        period,
        dailyRate,
      );

      expect(event.eventType).toBe('RentalCreated');
      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.aggregateId).toBe(rentalId.value);
      expect(event.rentalId).toBe(rentalId);
      expect(event.memberId).toBe(memberId);
      expect(event.equipmentId).toBe(equipmentId);
      expect(event.period).toBe(period);
      expect(event.dailyRate).toBe(dailyRate);
    });

    it('should generate unique event IDs', () => {
      const event1 = RentalCreated.create(
        rentalId,
        memberId,
        equipmentId,
        period,
        dailyRate,
      );
      const event2 = RentalCreated.create(
        rentalId,
        memberId,
        equipmentId,
        period,
        dailyRate,
      );

      expect(event1.eventId).not.toBe(event2.eventId);
    });

    it('should set occurredAt to current time', () => {
      const before = new Date();
      const event = RentalCreated.create(
        rentalId,
        memberId,
        equipmentId,
        period,
        dailyRate,
      );
      const after = new Date();

      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should implement DomainEvent interface', () => {
      const event = RentalCreated.create(
        rentalId,
        memberId,
        equipmentId,
        period,
        dailyRate,
      );

      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.eventType).toBeDefined();
      expect(event.aggregateId).toBeDefined();
    });
  });

  describe('RentalReturned', () => {
    it('should create event with correct properties', () => {
      const returnedAt = new Date('2024-01-06');
      const lateFees = Money.dollars(25);
      const totalCost = Money.dollars(225);

      const event = RentalReturned.create(
        rentalId,
        returnedAt,
        lateFees,
        totalCost,
      );

      expect(event.eventType).toBe('RentalReturned');
      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.aggregateId).toBe(rentalId.value);
      expect(event.rentalId).toBe(rentalId);
      expect(event.returnedAt).toBe(returnedAt);
      expect(event.lateFees).toBe(lateFees);
      expect(event.totalCost).toBe(totalCost);
    });

    it('should handle zero late fees', () => {
      const returnedAt = new Date('2024-01-05');
      const lateFees = Money.zero();
      const totalCost = Money.dollars(200);

      const event = RentalReturned.create(
        rentalId,
        returnedAt,
        lateFees,
        totalCost,
      );

      expect(event.lateFees.equals(Money.zero())).toBe(true);
    });

    it('should generate unique event IDs', () => {
      const returnedAt = new Date('2024-01-06');
      const lateFees = Money.dollars(25);
      const totalCost = Money.dollars(225);

      const event1 = RentalReturned.create(
        rentalId,
        returnedAt,
        lateFees,
        totalCost,
      );
      const event2 = RentalReturned.create(
        rentalId,
        returnedAt,
        lateFees,
        totalCost,
      );

      expect(event1.eventId).not.toBe(event2.eventId);
    });

    it('should implement DomainEvent interface', () => {
      const returnedAt = new Date('2024-01-06');
      const lateFees = Money.dollars(25);
      const totalCost = Money.dollars(225);

      const event = RentalReturned.create(
        rentalId,
        returnedAt,
        lateFees,
        totalCost,
      );

      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.eventType).toBeDefined();
      expect(event.aggregateId).toBeDefined();
    });
  });

  describe('RentalOverdue', () => {
    it('should create event with correct properties', () => {
      const daysOverdue = 3;
      const accruedLateFees = Money.dollars(75);

      const event = RentalOverdue.create(
        rentalId,
        memberId,
        equipmentId,
        daysOverdue,
        accruedLateFees,
      );

      expect(event.eventType).toBe('RentalOverdue');
      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.aggregateId).toBe(rentalId.value);
      expect(event.rentalId).toBe(rentalId);
      expect(event.memberId).toBe(memberId);
      expect(event.equipmentId).toBe(equipmentId);
      expect(event.daysOverdue).toBe(daysOverdue);
      expect(event.accruedLateFees).toBe(accruedLateFees);
    });

    it('should handle single day overdue', () => {
      const daysOverdue = 1;
      const accruedLateFees = Money.dollars(25);

      const event = RentalOverdue.create(
        rentalId,
        memberId,
        equipmentId,
        daysOverdue,
        accruedLateFees,
      );

      expect(event.daysOverdue).toBe(1);
    });

    it('should handle multiple days overdue', () => {
      const daysOverdue = 10;
      const accruedLateFees = Money.dollars(250);

      const event = RentalOverdue.create(
        rentalId,
        memberId,
        equipmentId,
        daysOverdue,
        accruedLateFees,
      );

      expect(event.daysOverdue).toBe(10);
      expect(event.accruedLateFees.equals(Money.dollars(250))).toBe(true);
    });

    it('should generate unique event IDs', () => {
      const daysOverdue = 3;
      const accruedLateFees = Money.dollars(75);

      const event1 = RentalOverdue.create(
        rentalId,
        memberId,
        equipmentId,
        daysOverdue,
        accruedLateFees,
      );
      const event2 = RentalOverdue.create(
        rentalId,
        memberId,
        equipmentId,
        daysOverdue,
        accruedLateFees,
      );

      expect(event1.eventId).not.toBe(event2.eventId);
    });

    it('should implement DomainEvent interface', () => {
      const daysOverdue = 3;
      const accruedLateFees = Money.dollars(75);

      const event = RentalOverdue.create(
        rentalId,
        memberId,
        equipmentId,
        daysOverdue,
        accruedLateFees,
      );

      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.eventType).toBeDefined();
      expect(event.aggregateId).toBeDefined();
    });
  });
});
