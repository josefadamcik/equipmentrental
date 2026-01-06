import { InMemoryReservationRepository } from '../InMemoryReservationRepository.js';
import { Reservation, ReservationStatus } from '../../../../domain/entities/Reservation.js';
import {
  ReservationId,
  EquipmentId,
  MemberId,
} from '../../../../domain/value-objects/identifiers.js';
import { DateRange } from '../../../../domain/value-objects/DateRange.js';

describe('InMemoryReservationRepository', () => {
  let repository: InMemoryReservationRepository;

  beforeEach(() => {
    repository = new InMemoryReservationRepository();
  });

  const createReservation = (daysOffset = 7, daysLength = 3): Reservation => {
    const start = new Date();
    start.setDate(start.getDate() + daysOffset);
    const end = new Date(start);
    end.setDate(end.getDate() + daysLength);

    return Reservation.create({
      equipmentId: EquipmentId.generate(),
      memberId: MemberId.generate(),
      period: DateRange.create(start, end),
    });
  };

  describe('save and findById', () => {
    it('should save and retrieve reservation by id', async () => {
      const reservation = createReservation();
      await repository.save(reservation);

      const found = await repository.findById(reservation.id);
      expect(found).toBeDefined();
      expect(found?.id.value).toBe(reservation.id.value);
    });

    it('should return undefined for non-existent id', async () => {
      const id = ReservationId.generate();
      const found = await repository.findById(id);
      expect(found).toBeUndefined();
    });
  });

  describe('findByMemberId', () => {
    it('should return all reservations for a member', async () => {
      const memberId = MemberId.generate();

      const reservation1 = createReservation();
      const reservation2 = Reservation.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(
          new Date(Date.now() + 86400000),
          new Date(Date.now() + 2 * 86400000),
        ),
      });

      await repository.save(reservation1);
      await repository.save(reservation2);

      const reservations = await repository.findByMemberId(memberId);
      expect(reservations).toHaveLength(1);
      expect(reservations[0].id.value).toBe(reservation2.id.value);
    });
  });

  describe('findByEquipmentId', () => {
    it('should return all reservations for equipment', async () => {
      const equipmentId = EquipmentId.generate();

      const reservation1 = createReservation();
      const reservation2 = Reservation.create({
        equipmentId,
        memberId: MemberId.generate(),
        period: DateRange.create(
          new Date(Date.now() + 86400000),
          new Date(Date.now() + 2 * 86400000),
        ),
      });

      await repository.save(reservation1);
      await repository.save(reservation2);

      const reservations = await repository.findByEquipmentId(equipmentId);
      expect(reservations).toHaveLength(1);
      expect(reservations[0].id.value).toBe(reservation2.id.value);
    });
  });

  describe('findByStatus', () => {
    it('should return reservations by status', async () => {
      const pending = createReservation();
      const confirmed = createReservation();
      confirmed.confirm();
      const cancelled = createReservation();
      cancelled.cancel();

      await repository.save(pending);
      await repository.save(confirmed);
      await repository.save(cancelled);

      const pendingReservations = await repository.findByStatus(ReservationStatus.PENDING);
      expect(pendingReservations).toHaveLength(1);

      const confirmedReservations = await repository.findByStatus(ReservationStatus.CONFIRMED);
      expect(confirmedReservations).toHaveLength(1);

      const cancelledReservations = await repository.findByStatus(ReservationStatus.CANCELLED);
      expect(cancelledReservations).toHaveLength(1);
    });
  });

  describe('findActive', () => {
    it('should return active reservations', async () => {
      const pending = createReservation();
      const confirmed = createReservation();
      confirmed.confirm();
      const cancelled = createReservation();
      cancelled.cancel();

      await repository.save(pending);
      await repository.save(confirmed);
      await repository.save(cancelled);

      const active = await repository.findActive();
      expect(active).toHaveLength(2);
    });
  });

  describe('findActiveByMemberId', () => {
    it('should return active reservations for member', async () => {
      const memberId = MemberId.generate();

      const activeForMember = Reservation.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(
          new Date(Date.now() + 86400000),
          new Date(Date.now() + 2 * 86400000),
        ),
      });

      const cancelledForMember = Reservation.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(
          new Date(Date.now() + 86400000),
          new Date(Date.now() + 2 * 86400000),
        ),
      });
      cancelledForMember.cancel();

      const activeForOther = createReservation();

      await repository.save(activeForMember);
      await repository.save(cancelledForMember);
      await repository.save(activeForOther);

      const reservations = await repository.findActiveByMemberId(memberId);
      expect(reservations).toHaveLength(1);
      expect(reservations[0].id.value).toBe(activeForMember.id.value);
    });
  });

  describe('findActiveByEquipmentId', () => {
    it('should return active reservations for equipment', async () => {
      const equipmentId = EquipmentId.generate();

      const active = Reservation.create({
        equipmentId,
        memberId: MemberId.generate(),
        period: DateRange.create(
          new Date(Date.now() + 86400000),
          new Date(Date.now() + 2 * 86400000),
        ),
      });

      const cancelled = Reservation.create({
        equipmentId,
        memberId: MemberId.generate(),
        period: DateRange.create(
          new Date(Date.now() + 86400000),
          new Date(Date.now() + 2 * 86400000),
        ),
      });
      cancelled.cancel();

      await repository.save(active);
      await repository.save(cancelled);

      const reservations = await repository.findActiveByEquipmentId(equipmentId);
      expect(reservations).toHaveLength(1);
      expect(reservations[0].id.value).toBe(active.id.value);
    });
  });

  describe('findConflicting', () => {
    it('should return reservations that conflict with period', async () => {
      const equipmentId = EquipmentId.generate();

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const conflicting = Reservation.create({
        equipmentId,
        memberId: MemberId.generate(),
        period: DateRange.create(
          new Date(Date.now() + 2 * 86400000),
          new Date(Date.now() + 5 * 86400000),
        ),
      });

      const nonConflicting = Reservation.create({
        equipmentId,
        memberId: MemberId.generate(),
        period: DateRange.create(
          new Date(Date.now() + 10 * 86400000),
          new Date(Date.now() + 12 * 86400000),
        ),
      });

      await repository.save(conflicting);
      await repository.save(nonConflicting);

      const checkPeriod = DateRange.create(tomorrow, nextWeek);
      const conflicts = await repository.findConflicting(equipmentId, checkPeriod);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].id.value).toBe(conflicting.id.value);
    });

    it('should not return cancelled reservations as conflicts', async () => {
      const equipmentId = EquipmentId.generate();

      const cancelled = Reservation.create({
        equipmentId,
        memberId: MemberId.generate(),
        period: DateRange.create(
          new Date(Date.now() + 2 * 86400000),
          new Date(Date.now() + 5 * 86400000),
        ),
      });
      cancelled.cancel();

      await repository.save(cancelled);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const checkPeriod = DateRange.create(tomorrow, nextWeek);
      const conflicts = await repository.findConflicting(equipmentId, checkPeriod);

      expect(conflicts).toHaveLength(0);
    });
  });

  describe('findReadyToFulfill', () => {
    it('should return confirmed reservations that have started', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const readyToFulfill = Reservation.create({
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period: DateRange.create(tomorrow, nextWeek),
      });
      readyToFulfill.confirm();

      const notYetStarted = createReservation();
      notYetStarted.confirm();

      // Save with past start date by using reconstitute
      const pastStart = new Date(Date.now() - 86400000); // yesterday
      const futureEnd = new Date(Date.now() + 86400000); // tomorrow
      const readyReservation = Reservation.reconstitute({
        ...readyToFulfill.toSnapshot(),
        period: DateRange.create(pastStart, futureEnd),
      });

      await repository.save(readyReservation);
      await repository.save(notYetStarted);

      const ready = await repository.findReadyToFulfill();
      expect(ready).toHaveLength(1);
      expect(ready[0].id.value).toBe(readyReservation.id.value);
    });
  });

  describe('findExpired', () => {
    it('should return active reservations that have ended', async () => {
      // Create a reservation in the future first
      const futureReservation = createReservation();

      // Then use reconstitute to make it expired
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const expired = Reservation.reconstitute({
        ...futureReservation.toSnapshot(),
        period: DateRange.create(twoDaysAgo, yesterday),
      });

      const notExpired = createReservation();

      await repository.save(expired);
      await repository.save(notExpired);

      const expiredReservations = await repository.findExpired();
      expect(expiredReservations).toHaveLength(1);
      expect(expiredReservations[0].id.value).toBe(expired.id.value);
    });
  });

  describe('findStartingInPeriod', () => {
    it('should return reservations starting in period', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const startingInPeriod = Reservation.create({
        equipmentId: EquipmentId.generate(),
        memberId: MemberId.generate(),
        period: DateRange.create(dayAfterTomorrow, nextWeek),
      });

      const startingLater = createReservation(14, 3);

      await repository.save(startingInPeriod);
      await repository.save(startingLater);

      const period = DateRange.create(tomorrow, nextWeek);
      const reservations = await repository.findStartingInPeriod(period);

      expect(reservations).toHaveLength(1);
      expect(reservations[0].id.value).toBe(startingInPeriod.id.value);
    });
  });

  describe('findByCreatedDateRange', () => {
    it('should return reservations created in date range', async () => {
      const reservation = createReservation();
      await repository.save(reservation);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const reservations = await repository.findByCreatedDateRange(yesterday, tomorrow);
      expect(reservations).toHaveLength(1);
    });
  });

  describe('count methods', () => {
    beforeEach(async () => {
      const pending = createReservation();
      const confirmed = createReservation();
      confirmed.confirm();
      const cancelled = createReservation();
      cancelled.cancel();

      await repository.save(pending);
      await repository.save(confirmed);
      await repository.save(cancelled);
    });

    it('should count total reservations', async () => {
      expect(await repository.count()).toBe(3);
    });

    it('should count by status', async () => {
      expect(await repository.countByStatus(ReservationStatus.PENDING)).toBe(1);
      expect(await repository.countByStatus(ReservationStatus.CONFIRMED)).toBe(1);
      expect(await repository.countByStatus(ReservationStatus.CANCELLED)).toBe(1);
    });

    it('should count active reservations by member', async () => {
      const memberId = MemberId.generate();

      const reservation1 = Reservation.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(
          new Date(Date.now() + 86400000),
          new Date(Date.now() + 2 * 86400000),
        ),
      });

      const reservation2 = Reservation.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(
          new Date(Date.now() + 86400000),
          new Date(Date.now() + 2 * 86400000),
        ),
      });
      reservation2.cancel();

      await repository.save(reservation1);
      await repository.save(reservation2);

      const count = await repository.countActiveByMemberId(memberId);
      expect(count).toBe(1);
    });
  });

  describe('exists and delete', () => {
    it('should check existence and delete reservation', async () => {
      const reservation = createReservation();
      await repository.save(reservation);

      expect(await repository.exists(reservation.id)).toBe(true);

      await repository.delete(reservation.id);

      expect(await repository.exists(reservation.id)).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all reservations', async () => {
      const reservation = createReservation();
      await repository.save(reservation);

      expect(await repository.count()).toBe(1);

      repository.clear();
      expect(await repository.count()).toBe(0);
    });
  });

  describe('data isolation', () => {
    it('should return clones to prevent external mutations', async () => {
      const reservation = createReservation();
      await repository.save(reservation);

      const found1 = await repository.findById(reservation.id);
      const found2 = await repository.findById(reservation.id);

      // Modifying one shouldn't affect the other
      found1?.confirm();

      expect(found2?.status).toBe(ReservationStatus.PENDING);

      // Also shouldn't affect what's in the repository
      const found3 = await repository.findById(reservation.id);
      expect(found3?.status).toBe(ReservationStatus.PENDING);
    });
  });
});
