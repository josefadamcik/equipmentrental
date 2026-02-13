/**
 * Integration tests for remaining command handlers
 * Tests ExtendRental, CreateReservation, CancelReservation, and AssessDamage
 */

import { ExtendRentalCommandHandler } from '../rental/ExtendRentalCommand.js';
import { CreateReservationCommandHandler } from '../reservation/CreateReservationCommand.js';
import { CancelReservationCommandHandler } from '../reservation/CancelReservationCommand.js';
import { AssessDamageCommandHandler } from '../damage/AssessDamageCommand.js';
import { Equipment } from '../../../domain/entities/Equipment.js';
import { Member } from '../../../domain/entities/Member.js';
import { Rental } from '../../../domain/entities/Rental.js';
import { Reservation } from '../../../domain/entities/Reservation.js';
import {
  EquipmentId,
  MemberId,
  RentalId,
  ReservationId,
} from '../../../domain/value-objects/identifiers.js';
import { Money } from '../../../domain/value-objects/Money.js';
import { DateRange } from '../../../domain/value-objects/DateRange.js';
import { EquipmentCondition } from '../../../domain/types/EquipmentCondition.js';
import { MembershipTier } from '../../../domain/types/MembershipTier.js';
import { EquipmentRepository } from '../../../domain/ports/EquipmentRepository.js';
import { MemberRepository } from '../../../domain/ports/MemberRepository.js';
import { RentalRepository } from '../../../domain/ports/RentalRepository.js';
import { ReservationRepository } from '../../../domain/ports/ReservationRepository.js';
import { EventPublisher } from '../../../domain/ports/EventPublisher.js';

// Simple in-memory repositories for testing
class TestEquipmentRepository implements EquipmentRepository {
  private equipment = new Map<string, Equipment>();
  async findById(id: EquipmentId): Promise<Equipment | undefined> {
    return this.equipment.get(id.value);
  }
  async save(equipment: Equipment): Promise<void> {
    this.equipment.set(equipment.id.value, equipment);
  }
  async findAll(): Promise<Equipment[]> {
    return [];
  }
  async findByCategory(): Promise<Equipment[]> {
    return [];
  }
  async findAvailable(): Promise<Equipment[]> {
    return [];
  }
  async findAvailableByCategory(): Promise<Equipment[]> {
    return [];
  }
  async findNeedingMaintenance(): Promise<Equipment[]> {
    return [];
  }
  async findAvailableDuringPeriod(): Promise<Equipment[]> {
    return [];
  }
  async delete(): Promise<void> {}
  async exists(): Promise<boolean> {
    return false;
  }
  async count(): Promise<number> {
    return 0;
  }
  async countByCategory(): Promise<number> {
    return 0;
  }
}

class TestMemberRepository implements MemberRepository {
  private members = new Map<string, Member>();
  async findById(id: MemberId): Promise<Member | undefined> {
    return this.members.get(id.value);
  }
  async save(member: Member): Promise<void> {
    this.members.set(member.id.value, member);
  }
  async findAll(): Promise<Member[]> {
    return [];
  }
  async findByEmail(): Promise<Member | undefined> {
    return undefined;
  }
  async findByTier(): Promise<Member[]> {
    return [];
  }
  async findActive(): Promise<Member[]> {
    return [];
  }
  async findWithActiveRentals(): Promise<Member[]> {
    return [];
  }
  async findByJoinDateRange(): Promise<Member[]> {
    return [];
  }
  async delete(): Promise<void> {}
  async exists(): Promise<boolean> {
    return false;
  }
  async emailExists(): Promise<boolean> {
    return false;
  }
  async count(): Promise<number> {
    return 0;
  }
  async countActive(): Promise<number> {
    return 0;
  }
  async countByTier(): Promise<number> {
    return 0;
  }
}

class TestRentalRepository implements RentalRepository {
  private rentals = new Map<string, Rental>();
  async findById(id: RentalId): Promise<Rental | undefined> {
    return this.rentals.get(id.value);
  }
  async save(rental: Rental): Promise<void> {
    this.rentals.set(rental.id.value, rental);
  }
  async findAll(): Promise<Rental[]> {
    return [];
  }
  async findByMemberId(): Promise<Rental[]> {
    return [];
  }
  async findByEquipmentId(): Promise<Rental[]> {
    return [];
  }
  async findByStatus(): Promise<Rental[]> {
    return [];
  }
  async findActive(): Promise<Rental[]> {
    return [];
  }
  async findActiveByMemberId(): Promise<Rental[]> {
    return [];
  }
  async findActiveByEquipmentId(): Promise<Rental | undefined> {
    return undefined;
  }
  async findOverdue(): Promise<Rental[]> {
    return [];
  }
  async findEndingInPeriod(): Promise<Rental[]> {
    return [];
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
    return 0;
  }
  async countByStatus(): Promise<number> {
    return 0;
  }
  async countActiveByMemberId(): Promise<number> {
    return 0;
  }
}

class TestReservationRepository implements ReservationRepository {
  private reservations = new Map<string, Reservation>();
  async findById(id: ReservationId): Promise<Reservation | undefined> {
    return this.reservations.get(id.value);
  }
  async save(reservation: Reservation): Promise<void> {
    this.reservations.set(reservation.id.value, reservation);
  }
  async findConflicting(equipmentId: EquipmentId, period: DateRange): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(
      (r) => r.equipmentId.value === equipmentId.value && r.overlaps(period) && r.isActive(),
    );
  }
  async findAll(): Promise<Reservation[]> {
    return [];
  }
  async findByMemberId(): Promise<Reservation[]> {
    return [];
  }
  async findByEquipmentId(): Promise<Reservation[]> {
    return [];
  }
  async findByStatus(): Promise<Reservation[]> {
    return [];
  }
  async findActive(): Promise<Reservation[]> {
    return [];
  }
  async findActiveByMemberId(): Promise<Reservation[]> {
    return [];
  }
  async findActiveByEquipmentId(): Promise<Reservation[]> {
    return [];
  }
  async findReadyToFulfill(): Promise<Reservation[]> {
    return [];
  }
  async findExpired(): Promise<Reservation[]> {
    return [];
  }
  async findStartingInPeriod(): Promise<Reservation[]> {
    return [];
  }
  async findByCreatedDateRange(): Promise<Reservation[]> {
    return [];
  }
  async delete(): Promise<void> {}
  async exists(): Promise<boolean> {
    return false;
  }
  async count(): Promise<number> {
    return 0;
  }
  async countByStatus(): Promise<number> {
    return 0;
  }
  async countActiveByMemberId(): Promise<number> {
    return 0;
  }
}

class TestEventPublisher implements EventPublisher {
  private events: any[] = [];
  async publish(event: any): Promise<void> {
    this.events.push(event);
  }
  getEvents(): any[] {
    return this.events;
  }
  async publishMany(): Promise<void> {}
  subscribe(): () => void {
    return () => {};
  }
  subscribeToAll(): () => void {
    return () => {};
  }
  unsubscribe(): void {}
  clearAllHandlers(): void {}
  getHandlerCount(): number {
    return 0;
  }
  hasHandlers(): boolean {
    return false;
  }
}

describe('ExtendRentalCommandHandler', () => {
  it('should extend a rental successfully', async () => {
    const equipmentRepo = new TestEquipmentRepository();
    const memberRepo = new TestMemberRepository();
    const rentalRepo = new TestRentalRepository();
    const reservationRepo = new TestReservationRepository();

    const handler = new ExtendRentalCommandHandler(
      rentalRepo,
      equipmentRepo,
      memberRepo,
      reservationRepo,
    );

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

    const member = Member.create({
      name: 'John Doe',
      email: 'john@example.com',
      tier: MembershipTier.GOLD,
      joinDate: new Date(),
      isActive: true,
    });
    await memberRepo.save(member);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);
    const rental = Rental.create({
      equipmentId: equipment.id,
      memberId: member.id,
      period: DateRange.create(startDate, endDate),
      baseCost: Money.dollars(150),
      conditionAtStart: EquipmentCondition.EXCELLENT,
    });
    await rentalRepo.save(rental);

    // Execute
    const result = await handler.execute({
      rentalId: rental.id.value,
      additionalDays: 2,
    });

    // Assert
    expect(result.rentalId).toBe(rental.id.value);
    expect(result.extensionDays).toBe(2);
    expect(result.additionalCost).toBeGreaterThan(0);
  });

  it('should throw error when extending with negative days', async () => {
    const equipmentRepo = new TestEquipmentRepository();
    const memberRepo = new TestMemberRepository();
    const rentalRepo = new TestRentalRepository();
    const reservationRepo = new TestReservationRepository();

    const handler = new ExtendRentalCommandHandler(
      rentalRepo,
      equipmentRepo,
      memberRepo,
      reservationRepo,
    );

    await expect(
      handler.execute({
        rentalId: 'some-id',
        additionalDays: -1,
      }),
    ).rejects.toThrow('Extension days must be positive');
  });
});

describe('CreateReservationCommandHandler', () => {
  it('should create a reservation successfully', async () => {
    const equipmentRepo = new TestEquipmentRepository();
    const memberRepo = new TestMemberRepository();
    const reservationRepo = new TestReservationRepository();
    const eventPublisher = new TestEventPublisher();

    const handler = new CreateReservationCommandHandler(
      equipmentRepo,
      memberRepo,
      reservationRepo,
      eventPublisher,
    );

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

    const member = Member.create({
      name: 'John Doe',
      email: 'john@example.com',
      tier: MembershipTier.GOLD,
      joinDate: new Date(),
      isActive: true,
    });
    await memberRepo.save(member);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 5);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    // Execute
    const result = await handler.execute({
      equipmentId: equipment.id.value,
      memberId: member.id.value,
      startDate,
      endDate,
    });

    // Assert
    expect(result.reservationId).toBeDefined();
    expect(result.estimatedCost).toBeGreaterThan(0);
    expect(eventPublisher.getEvents()).toHaveLength(1);
  });
});

describe('CancelReservationCommandHandler', () => {
  it('should cancel a reservation successfully', async () => {
    const reservationRepo = new TestReservationRepository();
    const eventPublisher = new TestEventPublisher();

    const handler = new CancelReservationCommandHandler(reservationRepo, eventPublisher);

    // Setup
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 5);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const reservation = Reservation.create({
      equipmentId: EquipmentId.generate(),
      memberId: MemberId.generate(),
      period: DateRange.create(startDate, endDate),
    });
    reservation.confirm();
    await reservationRepo.save(reservation);

    // Execute
    const result = await handler.execute({
      reservationId: reservation.id.value,
      reason: 'Change of plans',
    });

    // Assert
    expect(result.reservationId).toBe(reservation.id.value);
    expect(result.cancelledAt).toBeDefined();
    expect(result.reason).toBe('Change of plans');
    expect(eventPublisher.getEvents()).toHaveLength(1);
  });
});

describe('AssessDamageCommandHandler', () => {
  it('should assess damage successfully', async () => {
    const equipmentRepo = new TestEquipmentRepository();
    const rentalRepo = new TestRentalRepository();

    const handler = new AssessDamageCommandHandler(rentalRepo, equipmentRepo);

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

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 3);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1);

    const rental = Rental.create({
      equipmentId: equipment.id,
      memberId: MemberId.generate(),
      period: DateRange.create(startDate, endDate),
      baseCost: Money.dollars(100),
      conditionAtStart: EquipmentCondition.EXCELLENT,
    });
    // Return the rental
    rental.returnRental(EquipmentCondition.GOOD);
    await rentalRepo.save(rental);

    // Execute
    const result = await handler.execute({
      rentalId: rental.id.value,
      equipmentId: equipment.id.value,
      conditionAfter: EquipmentCondition.GOOD,
      notes: 'Minor wear and tear',
      assessedBy: 'Inspector Jane',
    });

    // Assert
    expect(result.assessmentId).toBeDefined();
    expect(result.conditionBefore).toBe(EquipmentCondition.EXCELLENT);
    expect(result.conditionAfter).toBe(EquipmentCondition.GOOD);
    expect(result.hasDamage).toBe(true);
    expect(result.degradationLevels).toBe(1);
    expect(result.damageFee).toBe(50);
  });

  it('should throw error when assessing damage on non-returned rental', async () => {
    const equipmentRepo = new TestEquipmentRepository();
    const rentalRepo = new TestRentalRepository();

    const handler = new AssessDamageCommandHandler(rentalRepo, equipmentRepo);

    // Setup active rental
    const equipment = Equipment.create({
      name: 'Drill',
      description: 'Power drill',
      category: 'Tools',
      dailyRate: Money.dollars(50),
      condition: EquipmentCondition.EXCELLENT,
      purchaseDate: new Date(),
    });
    await equipmentRepo.save(equipment);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 1);

    const rental = Rental.create({
      equipmentId: equipment.id,
      memberId: MemberId.generate(),
      period: DateRange.create(startDate, endDate),
      baseCost: Money.dollars(100),
      conditionAtStart: EquipmentCondition.EXCELLENT,
    });
    await rentalRepo.save(rental);

    await expect(
      handler.execute({
        rentalId: rental.id.value,
        equipmentId: equipment.id.value,
        conditionAfter: EquipmentCondition.GOOD,
        notes: 'Test',
        assessedBy: 'Inspector',
      }),
    ).rejects.toThrow('Cannot assess damage on rental that has not been returned');
  });
});
