import { describe, it, expect, beforeEach } from '@jest/globals';
import { ReservationCreated, ReservationCancelled } from '../ReservationEvents';
import { ReservationId, MemberId, EquipmentId } from '../../value-objects/identifiers';
import { DateRange } from '../../value-objects/DateRange';

describe('ReservationEvents', () => {
  let reservationId: ReservationId;
  let memberId: MemberId;
  let equipmentId: EquipmentId;
  let period: DateRange;

  beforeEach(() => {
    reservationId = ReservationId.generate();
    memberId = MemberId.generate();
    equipmentId = EquipmentId.generate();
    period = DateRange.create(new Date('2024-02-01'), new Date('2024-02-05'));
  });

  describe('ReservationCreated', () => {
    it('should create event with correct properties', () => {
      const event = ReservationCreated.create(reservationId, memberId, equipmentId, period);

      expect(event.eventType).toBe('ReservationCreated');
      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.aggregateId).toBe(reservationId.value);
      expect(event.reservationId).toBe(reservationId);
      expect(event.memberId).toBe(memberId);
      expect(event.equipmentId).toBe(equipmentId);
      expect(event.period).toBe(period);
    });

    it('should generate unique event IDs', () => {
      const event1 = ReservationCreated.create(reservationId, memberId, equipmentId, period);
      const event2 = ReservationCreated.create(reservationId, memberId, equipmentId, period);

      expect(event1.eventId).not.toBe(event2.eventId);
    });

    it('should set occurredAt to current time', () => {
      const before = new Date();
      const event = ReservationCreated.create(reservationId, memberId, equipmentId, period);
      const after = new Date();

      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should implement DomainEvent interface', () => {
      const event = ReservationCreated.create(reservationId, memberId, equipmentId, period);

      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.eventType).toBeDefined();
      expect(event.aggregateId).toBeDefined();
    });

    it('should preserve period details', () => {
      const event = ReservationCreated.create(reservationId, memberId, equipmentId, period);

      expect(event.period.start).toEqual(period.start);
      expect(event.period.end).toEqual(period.end);
      expect(event.period.getDays()).toBe(period.getDays());
    });
  });

  describe('ReservationCancelled', () => {
    it('should create event with reason', () => {
      const reason = 'Customer request';

      const event = ReservationCancelled.create(reservationId, memberId, reason);

      expect(event.eventType).toBe('ReservationCancelled');
      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.aggregateId).toBe(reservationId.value);
      expect(event.reservationId).toBe(reservationId);
      expect(event.memberId).toBe(memberId);
      expect(event.reason).toBe(reason);
    });

    it('should create event without reason', () => {
      const event = ReservationCancelled.create(reservationId, memberId);

      expect(event.eventType).toBe('ReservationCancelled');
      expect(event.reservationId).toBe(reservationId);
      expect(event.memberId).toBe(memberId);
      expect(event.reason).toBeUndefined();
    });

    it('should handle various cancellation reasons', () => {
      const reasons = [
        'Customer request',
        'Equipment unavailable',
        'Payment failed',
        'No longer needed',
      ];

      reasons.forEach((reason) => {
        const event = ReservationCancelled.create(reservationId, memberId, reason);

        expect(event.reason).toBe(reason);
      });
    });

    it('should generate unique event IDs', () => {
      const event1 = ReservationCancelled.create(reservationId, memberId, 'Reason 1');
      const event2 = ReservationCancelled.create(reservationId, memberId, 'Reason 2');

      expect(event1.eventId).not.toBe(event2.eventId);
    });

    it('should set occurredAt to current time', () => {
      const before = new Date();
      const event = ReservationCancelled.create(reservationId, memberId, 'Test reason');
      const after = new Date();

      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should implement DomainEvent interface', () => {
      const event = ReservationCancelled.create(reservationId, memberId, 'Test reason');

      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.eventType).toBeDefined();
      expect(event.aggregateId).toBeDefined();
    });
  });
});
