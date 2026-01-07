import { Reservation, ReservationStatus } from '../Reservation.js';
import { ReservationId, EquipmentId, MemberId } from '../../value-objects/identifiers.js';
import { DateRange } from '../../value-objects/DateRange.js';

describe('Reservation Entity', () => {
  describe('create', () => {
    it('should create reservation with valid future dates', () => {
      const equipmentId = EquipmentId.generate();
      const memberId = MemberId.generate();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const period = DateRange.create(tomorrow, dayAfterTomorrow);

      const reservation = Reservation.create({
        equipmentId,
        memberId,
        period,
      });

      expect(reservation.equipmentId).toBe(equipmentId);
      expect(reservation.memberId).toBe(memberId);
      expect(reservation.period).toBe(period);
      expect(reservation.status).toBe(ReservationStatus.PENDING);
      expect(reservation.createdAt).toBeInstanceOf(Date);
      expect(reservation.confirmedAt).toBeUndefined();
      expect(reservation.cancelledAt).toBeUndefined();
      expect(reservation.fulfilledAt).toBeUndefined();
    });

    it('should throw error if period has already started', () => {
      const equipmentId = EquipmentId.generate();
      const memberId = MemberId.generate();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const period = DateRange.create(yesterday, tomorrow);

      expect(() =>
        Reservation.create({
          equipmentId,
          memberId,
          period,
        }),
      ).toThrow('Reservation period must be in the future');
    });

    it('should throw error if period is in the past', () => {
      const equipmentId = EquipmentId.generate();
      const memberId = MemberId.generate();
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const period = DateRange.create(twoDaysAgo, yesterday);

      expect(() =>
        Reservation.create({
          equipmentId,
          memberId,
          period,
        }),
      ).toThrow('Reservation period must be in the future');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute reservation from props', () => {
      const id = ReservationId.generate();
      const equipmentId = EquipmentId.generate();
      const memberId = MemberId.generate();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const period = DateRange.create(tomorrow, dayAfterTomorrow);
      const createdAt = new Date();
      const confirmedAt = new Date();

      const reservation = Reservation.reconstitute({
        id,
        equipmentId,
        memberId,
        period,
        status: ReservationStatus.CONFIRMED,
        createdAt,
        confirmedAt,
      });

      expect(reservation.id).toBe(id);
      expect(reservation.equipmentId).toBe(equipmentId);
      expect(reservation.memberId).toBe(memberId);
      expect(reservation.period).toBe(period);
      expect(reservation.status).toBe(ReservationStatus.CONFIRMED);
      expect(reservation.createdAt).toBe(createdAt);
      expect(reservation.confirmedAt).toBe(confirmedAt);
    });
  });

  describe('confirm', () => {
    it('should confirm pending reservation', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const period = DateRange.create(tomorrow, dayAfterTomorrow);

      const reservation = Reservation.create({
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period,
      });

      const now = new Date();
      reservation.confirm(now);

      expect(reservation.status).toBe(ReservationStatus.CONFIRMED);
      expect(reservation.confirmedAt).toBe(now);
    });

    it('should throw error if reservation is not pending', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const period = DateRange.create(tomorrow, dayAfterTomorrow);

      const reservation = Reservation.reconstitute({
        id: ReservationId.generate(),
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period,
        status: ReservationStatus.CONFIRMED,
        createdAt: new Date(),
        confirmedAt: new Date(),
      });

      expect(() => reservation.confirm()).toThrow('Only pending reservations can be confirmed');
    });

    it('should throw error if reservation period has already started', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const period = DateRange.create(yesterday, tomorrow);

      const reservation = Reservation.reconstitute({
        id: ReservationId.generate(),
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period,
        status: ReservationStatus.PENDING,
        createdAt: new Date(),
      });

      expect(() => reservation.confirm()).toThrow(
        'Cannot confirm reservation that has already started',
      );
    });
  });

  describe('cancel', () => {
    it('should cancel pending reservation', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const period = DateRange.create(tomorrow, dayAfterTomorrow);

      const reservation = Reservation.create({
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period,
      });

      const now = new Date();
      reservation.cancel(now);

      expect(reservation.status).toBe(ReservationStatus.CANCELLED);
      expect(reservation.cancelledAt).toBe(now);
    });

    it('should cancel confirmed reservation', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const period = DateRange.create(tomorrow, dayAfterTomorrow);

      const reservation = Reservation.reconstitute({
        id: ReservationId.generate(),
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period,
        status: ReservationStatus.CONFIRMED,
        createdAt: new Date(),
        confirmedAt: new Date(),
      });

      const now = new Date();
      reservation.cancel(now);

      expect(reservation.status).toBe(ReservationStatus.CANCELLED);
      expect(reservation.cancelledAt).toBe(now);
    });

    it('should throw error if reservation is fulfilled', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const period = DateRange.create(yesterday, tomorrow);

      const reservation = Reservation.reconstitute({
        id: ReservationId.generate(),
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period,
        status: ReservationStatus.FULFILLED,
        createdAt: new Date(),
        confirmedAt: new Date(),
        fulfilledAt: new Date(),
      });

      expect(() => reservation.cancel()).toThrow(
        'Only pending or confirmed reservations can be cancelled',
      );
    });

    it('should throw error if reservation is cancelled', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const period = DateRange.create(tomorrow, dayAfterTomorrow);

      const reservation = Reservation.reconstitute({
        id: ReservationId.generate(),
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period,
        status: ReservationStatus.CANCELLED,
        createdAt: new Date(),
        cancelledAt: new Date(),
      });

      expect(() => reservation.cancel()).toThrow(
        'Only pending or confirmed reservations can be cancelled',
      );
    });

    it('should throw error if reservation has expired', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const period = DateRange.create(twoDaysAgo, yesterday);

      const reservation = Reservation.reconstitute({
        id: ReservationId.generate(),
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period,
        status: ReservationStatus.PENDING,
        createdAt: new Date(),
      });

      expect(() => reservation.cancel()).toThrow('Cannot cancel expired reservation');
    });
  });

  describe('fulfill', () => {
    it('should fulfill confirmed reservation when period has started', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const period = DateRange.create(yesterday, tomorrow);

      const reservation = Reservation.reconstitute({
        id: ReservationId.generate(),
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period,
        status: ReservationStatus.CONFIRMED,
        createdAt: new Date(),
        confirmedAt: new Date(),
      });

      const now = new Date();
      reservation.fulfill(now);

      expect(reservation.status).toBe(ReservationStatus.FULFILLED);
      expect(reservation.fulfilledAt).toBe(now);
    });

    it('should throw error if reservation is not confirmed', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const period = DateRange.create(yesterday, tomorrow);

      const reservation = Reservation.reconstitute({
        id: ReservationId.generate(),
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period,
        status: ReservationStatus.PENDING,
        createdAt: new Date(),
      });

      expect(() => reservation.fulfill()).toThrow('Only confirmed reservations can be fulfilled');
    });

    it('should throw error if reservation period has not started', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const period = DateRange.create(tomorrow, dayAfterTomorrow);

      const reservation = Reservation.reconstitute({
        id: ReservationId.generate(),
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period,
        status: ReservationStatus.CONFIRMED,
        createdAt: new Date(),
        confirmedAt: new Date(),
      });

      expect(() => reservation.fulfill()).toThrow('Cannot fulfill reservation before start date');
    });
  });

  describe('markAsExpired', () => {
    it('should mark pending reservation as expired when period has ended', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const period = DateRange.create(twoDaysAgo, yesterday);

      const reservation = Reservation.reconstitute({
        id: ReservationId.generate(),
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period,
        status: ReservationStatus.PENDING,
        createdAt: new Date(),
      });

      const now = new Date();
      reservation.markAsExpired(now);

      expect(reservation.status).toBe(ReservationStatus.EXPIRED);
    });

    it('should mark confirmed reservation as expired when period has ended', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const period = DateRange.create(twoDaysAgo, yesterday);

      const reservation = Reservation.reconstitute({
        id: ReservationId.generate(),
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period,
        status: ReservationStatus.CONFIRMED,
        createdAt: new Date(),
        confirmedAt: new Date(),
      });

      const now = new Date();
      reservation.markAsExpired(now);

      expect(reservation.status).toBe(ReservationStatus.EXPIRED);
    });

    it('should throw error if reservation is fulfilled', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const period = DateRange.create(twoDaysAgo, yesterday);

      const reservation = Reservation.reconstitute({
        id: ReservationId.generate(),
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period,
        status: ReservationStatus.FULFILLED,
        createdAt: new Date(),
        confirmedAt: new Date(),
        fulfilledAt: new Date(),
      });

      expect(() => reservation.markAsExpired()).toThrow(
        'Only pending or confirmed reservations can expire',
      );
    });

    it('should throw error if reservation period has not ended', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const period = DateRange.create(yesterday, tomorrow);

      const reservation = Reservation.reconstitute({
        id: ReservationId.generate(),
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period,
        status: ReservationStatus.PENDING,
        createdAt: new Date(),
      });

      expect(() => reservation.markAsExpired()).toThrow('Reservation period has not ended yet');
    });
  });

  describe('isActive', () => {
    it('should return true for pending reservation with future period', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const period = DateRange.create(tomorrow, dayAfterTomorrow);

      const reservation = Reservation.create({
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period,
      });

      expect(reservation.isActive()).toBe(true);
    });

    it('should return true for confirmed reservation with future period', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const period = DateRange.create(tomorrow, dayAfterTomorrow);

      const reservation = Reservation.reconstitute({
        id: ReservationId.generate(),
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period,
        status: ReservationStatus.CONFIRMED,
        createdAt: new Date(),
        confirmedAt: new Date(),
      });

      expect(reservation.isActive()).toBe(true);
    });

    it('should return false for cancelled reservation', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const period = DateRange.create(tomorrow, dayAfterTomorrow);

      const reservation = Reservation.reconstitute({
        id: ReservationId.generate(),
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period,
        status: ReservationStatus.CANCELLED,
        createdAt: new Date(),
        cancelledAt: new Date(),
      });

      expect(reservation.isActive()).toBe(false);
    });

    it('should return false for expired reservation', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const period = DateRange.create(tomorrow, dayAfterTomorrow);

      const reservation = Reservation.reconstitute({
        id: ReservationId.generate(),
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period,
        status: ReservationStatus.EXPIRED,
        createdAt: new Date(),
      });

      expect(reservation.isActive()).toBe(false);
    });

    it('should return false for fulfilled reservation', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const period = DateRange.create(yesterday, tomorrow);

      const reservation = Reservation.reconstitute({
        id: ReservationId.generate(),
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period,
        status: ReservationStatus.FULFILLED,
        createdAt: new Date(),
        confirmedAt: new Date(),
        fulfilledAt: new Date(),
      });

      expect(reservation.isActive()).toBe(false);
    });

    it('should return false for pending reservation with expired period', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const period = DateRange.create(twoDaysAgo, yesterday);

      const reservation = Reservation.reconstitute({
        id: ReservationId.generate(),
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period,
        status: ReservationStatus.PENDING,
        createdAt: new Date(),
      });

      expect(reservation.isActive()).toBe(false);
    });
  });

  describe('overlaps', () => {
    it('should return true when periods overlap', () => {
      const start1 = new Date('2025-01-01');
      const end1 = new Date('2025-01-05');
      const period1 = DateRange.create(start1, end1);

      const reservation = Reservation.reconstitute({
        id: ReservationId.generate(),
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period: period1,
        status: ReservationStatus.CONFIRMED,
        createdAt: new Date(),
        confirmedAt: new Date(),
      });

      const start2 = new Date('2025-01-03');
      const end2 = new Date('2025-01-07');
      const period2 = DateRange.create(start2, end2);

      expect(reservation.overlaps(period2)).toBe(true);
    });

    it('should return false when periods do not overlap', () => {
      const start1 = new Date('2025-01-01');
      const end1 = new Date('2025-01-05');
      const period1 = DateRange.create(start1, end1);

      const reservation = Reservation.reconstitute({
        id: ReservationId.generate(),
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period: period1,
        status: ReservationStatus.CONFIRMED,
        createdAt: new Date(),
        confirmedAt: new Date(),
      });

      const start2 = new Date('2025-01-10');
      const end2 = new Date('2025-01-15');
      const period2 = DateRange.create(start2, end2);

      expect(reservation.overlaps(period2)).toBe(false);
    });
  });

  describe('isReadyToFulfill', () => {
    it('should return true for confirmed reservation when period has started', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const period = DateRange.create(yesterday, tomorrow);

      const reservation = Reservation.reconstitute({
        id: ReservationId.generate(),
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period,
        status: ReservationStatus.CONFIRMED,
        createdAt: new Date(),
        confirmedAt: new Date(),
      });

      expect(reservation.isReadyToFulfill()).toBe(true);
    });

    it('should return false for confirmed reservation when period has not started', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const period = DateRange.create(tomorrow, dayAfterTomorrow);

      const reservation = Reservation.reconstitute({
        id: ReservationId.generate(),
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period,
        status: ReservationStatus.CONFIRMED,
        createdAt: new Date(),
        confirmedAt: new Date(),
      });

      expect(reservation.isReadyToFulfill()).toBe(false);
    });

    it('should return false for pending reservation even if period has started', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const period = DateRange.create(yesterday, tomorrow);

      const reservation = Reservation.reconstitute({
        id: ReservationId.generate(),
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period,
        status: ReservationStatus.PENDING,
        createdAt: new Date(),
      });

      expect(reservation.isReadyToFulfill()).toBe(false);
    });
  });

  describe('toSnapshot', () => {
    it('should return a copy of reservation props', () => {
      const id = ReservationId.generate();
      const equipmentId = EquipmentId.generate();
      const memberId = MemberId.generate();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const period = DateRange.create(tomorrow, dayAfterTomorrow);
      const createdAt = new Date();
      const confirmedAt = new Date();

      const reservation = Reservation.reconstitute({
        id,
        equipmentId,
        memberId,
        period,
        status: ReservationStatus.CONFIRMED,
        createdAt,
        confirmedAt,
      });

      const snapshot = reservation.toSnapshot();

      expect(snapshot.id).toBe(id);
      expect(snapshot.equipmentId).toBe(equipmentId);
      expect(snapshot.memberId).toBe(memberId);
      expect(snapshot.period).toBe(period);
      expect(snapshot.status).toBe(ReservationStatus.CONFIRMED);
      expect(snapshot.createdAt).toBe(createdAt);
      expect(snapshot.confirmedAt).toBe(confirmedAt);
    });
  });
});
