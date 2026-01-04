import { ReservationRepository } from '../ReservationRepository';
import { Reservation, ReservationStatus } from '../../entities/Reservation';
import { ReservationId, MemberId, EquipmentId } from '../../value-objects/identifiers';
import { DateRange } from '../../value-objects/DateRange';

/**
 * Mock implementation of ReservationRepository for testing
 */
class MockReservationRepository implements ReservationRepository {
  private reservations: Map<string, Reservation> = new Map();

  async findById(id: ReservationId): Promise<Reservation | undefined> {
    return this.reservations.get(id.value);
  }

  async findAll(): Promise<Reservation[]> {
    return Array.from(this.reservations.values());
  }

  async findByMemberId(memberId: MemberId): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter((r) => r.memberId.equals(memberId));
  }

  async findByEquipmentId(equipmentId: EquipmentId): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter((r) => r.equipmentId.equals(equipmentId));
  }

  async findByStatus(status: ReservationStatus): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter((r) => r.status === status);
  }

  async findActive(now: Date = new Date()): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter((r) => r.isActive(now));
  }

  async findActiveByMemberId(memberId: MemberId, now: Date = new Date()): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(
      (r) => r.memberId.equals(memberId) && r.isActive(now),
    );
  }

  async findActiveByEquipmentId(
    equipmentId: EquipmentId,
    now: Date = new Date(),
  ): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(
      (r) => r.equipmentId.equals(equipmentId) && r.isActive(now),
    );
  }

  async findConflicting(equipmentId: EquipmentId, period: DateRange): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(
      (r) =>
        r.equipmentId.equals(equipmentId) &&
        (r.status === ReservationStatus.PENDING || r.status === ReservationStatus.CONFIRMED) &&
        r.overlaps(period),
    );
  }

  async findReadyToFulfill(now: Date = new Date()): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter((r) => r.isReadyToFulfill(now));
  }

  async findExpired(now: Date = new Date()): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(
      (r) => r.status === ReservationStatus.EXPIRED || (!r.isActive(now) && r.period.hasEnded(now)),
    );
  }

  async findStartingInPeriod(period: DateRange): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter((r) => period.contains(r.period.start));
  }

  async findByCreatedDateRange(startDate: Date, endDate: Date): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(
      (r) => r.createdAt >= startDate && r.createdAt <= endDate,
    );
  }

  async save(reservation: Reservation): Promise<void> {
    this.reservations.set(reservation.id.value, reservation);
  }

  async delete(id: ReservationId): Promise<void> {
    this.reservations.delete(id.value);
  }

  async exists(id: ReservationId): Promise<boolean> {
    return this.reservations.has(id.value);
  }

  async count(): Promise<number> {
    return this.reservations.size;
  }

  async countByStatus(status: ReservationStatus): Promise<number> {
    return (await this.findByStatus(status)).length;
  }

  async countActiveByMemberId(memberId: MemberId, now: Date = new Date()): Promise<number> {
    return (await this.findActiveByMemberId(memberId, now)).length;
  }

  clear(): void {
    this.reservations.clear();
  }
}

describe('ReservationRepository Port', () => {
  let repository: MockReservationRepository;
  let reservation: Reservation;
  const memberId = MemberId.generate();
  const equipmentId = EquipmentId.generate();

  beforeEach(() => {
    repository = new MockReservationRepository();
    // Create reservation for future dates
    reservation = Reservation.create({
      equipmentId,
      memberId,
      period: DateRange.create(new Date('2030-01-01'), new Date('2030-01-10')),
    });
  });

  describe('save', () => {
    it('should save reservation', async () => {
      await repository.save(reservation);
      const found = await repository.findById(reservation.id);
      expect(found).toBeDefined();
      expect(found?.status).toBe(ReservationStatus.PENDING);
    });

    it('should update existing reservation', async () => {
      await repository.save(reservation);
      reservation.confirm();
      await repository.save(reservation);

      const found = await repository.findById(reservation.id);
      expect(found?.status).toBe(ReservationStatus.CONFIRMED);
    });
  });

  describe('findById', () => {
    it('should find reservation by id', async () => {
      await repository.save(reservation);
      const found = await repository.findById(reservation.id);
      expect(found).toBeDefined();
      expect(found?.id.equals(reservation.id)).toBe(true);
    });

    it('should return undefined for non-existent id', async () => {
      const nonExistentId = ReservationId.generate();
      const found = await repository.findById(nonExistentId);
      expect(found).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should return empty array when no reservations exist', async () => {
      const all = await repository.findAll();
      expect(all).toEqual([]);
    });

    it('should return all reservations', async () => {
      const reservation2 = Reservation.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(new Date('2030-02-01'), new Date('2030-02-10')),
      });

      await repository.save(reservation);
      await repository.save(reservation2);

      const all = await repository.findAll();
      expect(all).toHaveLength(2);
    });
  });

  describe('findByMemberId', () => {
    it('should find reservations by member', async () => {
      const otherMemberId = MemberId.generate();
      const reservation2 = Reservation.create({
        equipmentId: EquipmentId.generate(),
        memberId: otherMemberId,
        period: DateRange.create(new Date('2030-02-01'), new Date('2030-02-10')),
      });

      await repository.save(reservation);
      await repository.save(reservation2);

      const memberReservations = await repository.findByMemberId(memberId);
      expect(memberReservations).toHaveLength(1);
      expect(memberReservations[0].memberId.equals(memberId)).toBe(true);
    });
  });

  describe('findByEquipmentId', () => {
    it('should find reservations by equipment', async () => {
      const otherEquipmentId = EquipmentId.generate();
      const reservation2 = Reservation.create({
        equipmentId: otherEquipmentId,
        memberId,
        period: DateRange.create(new Date('2030-02-01'), new Date('2030-02-10')),
      });

      await repository.save(reservation);
      await repository.save(reservation2);

      const equipmentReservations = await repository.findByEquipmentId(equipmentId);
      expect(equipmentReservations).toHaveLength(1);
      expect(equipmentReservations[0].equipmentId.equals(equipmentId)).toBe(true);
    });
  });

  describe('findByStatus', () => {
    it('should find reservations by status', async () => {
      await repository.save(reservation);

      const pending = await repository.findByStatus(ReservationStatus.PENDING);
      expect(pending).toHaveLength(1);

      reservation.confirm();
      await repository.save(reservation);

      const confirmed = await repository.findByStatus(ReservationStatus.CONFIRMED);
      expect(confirmed).toHaveLength(1);
    });
  });

  describe('findActive', () => {
    it('should find only active reservations', async () => {
      await repository.save(reservation);

      const active = await repository.findActive(new Date('2029-12-01'));
      expect(active).toHaveLength(1);

      reservation.cancel();
      await repository.save(reservation);

      const activeAfterCancel = await repository.findActive(new Date('2029-12-01'));
      expect(activeAfterCancel).toHaveLength(0);
    });
  });

  describe('findActiveByMemberId', () => {
    it('should find active reservations for specific member', async () => {
      const otherMemberId = MemberId.generate();
      const reservation2 = Reservation.create({
        equipmentId: EquipmentId.generate(),
        memberId: otherMemberId,
        period: DateRange.create(new Date('2030-02-01'), new Date('2030-02-10')),
      });

      await repository.save(reservation);
      await repository.save(reservation2);

      const memberActive = await repository.findActiveByMemberId(memberId, new Date('2029-12-01'));
      expect(memberActive).toHaveLength(1);
      expect(memberActive[0].memberId.equals(memberId)).toBe(true);
    });
  });

  describe('findActiveByEquipmentId', () => {
    it('should find active reservations for specific equipment', async () => {
      await repository.save(reservation);

      const activeReservations = await repository.findActiveByEquipmentId(
        equipmentId,
        new Date('2029-12-01'),
      );
      expect(activeReservations).toHaveLength(1);
      expect(activeReservations[0].equipmentId.equals(equipmentId)).toBe(true);
    });
  });

  describe('findConflicting', () => {
    it('should find reservations that overlap with a period', async () => {
      await repository.save(reservation);
      reservation.confirm();
      await repository.save(reservation);

      const overlappingPeriod = DateRange.create(new Date('2030-01-05'), new Date('2030-01-15'));
      const conflicts = await repository.findConflicting(equipmentId, overlappingPeriod);
      expect(conflicts).toHaveLength(1);

      const nonOverlappingPeriod = DateRange.create(new Date('2030-02-01'), new Date('2030-02-10'));
      const noConflicts = await repository.findConflicting(equipmentId, nonOverlappingPeriod);
      expect(noConflicts).toHaveLength(0);
    });

    it('should not return cancelled reservations as conflicts', async () => {
      await repository.save(reservation);
      reservation.cancel();
      await repository.save(reservation);

      const overlappingPeriod = DateRange.create(new Date('2030-01-05'), new Date('2030-01-15'));
      const conflicts = await repository.findConflicting(equipmentId, overlappingPeriod);
      expect(conflicts).toHaveLength(0);
    });
  });

  describe('findReadyToFulfill', () => {
    it('should find reservations ready to be fulfilled', async () => {
      await repository.save(reservation);
      reservation.confirm();
      await repository.save(reservation);

      // Before start date
      let ready = await repository.findReadyToFulfill(new Date('2029-12-31'));
      expect(ready).toHaveLength(0);

      // After start date
      ready = await repository.findReadyToFulfill(new Date('2030-01-02'));
      expect(ready).toHaveLength(1);
    });

    it('should not return pending reservations', async () => {
      await repository.save(reservation);
      const ready = await repository.findReadyToFulfill(new Date('2030-01-02'));
      expect(ready).toHaveLength(0);
    });
  });

  describe('delete', () => {
    it('should delete reservation', async () => {
      await repository.save(reservation);
      expect(await repository.exists(reservation.id)).toBe(true);

      await repository.delete(reservation.id);
      expect(await repository.exists(reservation.id)).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true for existing reservation', async () => {
      await repository.save(reservation);
      expect(await repository.exists(reservation.id)).toBe(true);
    });

    it('should return false for non-existent reservation', async () => {
      const nonExistentId = ReservationId.generate();
      expect(await repository.exists(nonExistentId)).toBe(false);
    });
  });

  describe('count', () => {
    it('should count all reservations', async () => {
      expect(await repository.count()).toBe(0);

      await repository.save(reservation);
      expect(await repository.count()).toBe(1);
    });
  });

  describe('countByStatus', () => {
    it('should count reservations by status', async () => {
      const reservation2 = Reservation.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(new Date('2030-02-01'), new Date('2030-02-10')),
      });

      await repository.save(reservation);
      await repository.save(reservation2);

      expect(await repository.countByStatus(ReservationStatus.PENDING)).toBe(2);

      reservation.confirm();
      await repository.save(reservation);

      expect(await repository.countByStatus(ReservationStatus.PENDING)).toBe(1);
      expect(await repository.countByStatus(ReservationStatus.CONFIRMED)).toBe(1);
    });
  });

  describe('countActiveByMemberId', () => {
    it('should count active reservations for member', async () => {
      const reservation2 = Reservation.create({
        equipmentId: EquipmentId.generate(),
        memberId,
        period: DateRange.create(new Date('2030-02-01'), new Date('2030-02-10')),
      });

      await repository.save(reservation);
      await repository.save(reservation2);

      expect(await repository.countActiveByMemberId(memberId, new Date('2029-12-01'))).toBe(2);

      reservation.cancel();
      await repository.save(reservation);

      expect(await repository.countActiveByMemberId(memberId, new Date('2029-12-01'))).toBe(1);
    });
  });

  describe('type compliance', () => {
    it('should implement all required methods', () => {
      const repo: ReservationRepository = repository;
      expect(typeof repo.findById).toBe('function');
      expect(typeof repo.findAll).toBe('function');
      expect(typeof repo.findByMemberId).toBe('function');
      expect(typeof repo.findByEquipmentId).toBe('function');
      expect(typeof repo.findByStatus).toBe('function');
      expect(typeof repo.findActive).toBe('function');
      expect(typeof repo.findActiveByMemberId).toBe('function');
      expect(typeof repo.findActiveByEquipmentId).toBe('function');
      expect(typeof repo.findConflicting).toBe('function');
      expect(typeof repo.findReadyToFulfill).toBe('function');
      expect(typeof repo.findExpired).toBe('function');
      expect(typeof repo.findStartingInPeriod).toBe('function');
      expect(typeof repo.findByCreatedDateRange).toBe('function');
      expect(typeof repo.save).toBe('function');
      expect(typeof repo.delete).toBe('function');
      expect(typeof repo.exists).toBe('function');
      expect(typeof repo.count).toBe('function');
      expect(typeof repo.countByStatus).toBe('function');
      expect(typeof repo.countActiveByMemberId).toBe('function');
    });
  });
});
