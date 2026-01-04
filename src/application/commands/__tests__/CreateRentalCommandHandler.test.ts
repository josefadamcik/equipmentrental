import { CreateRentalCommandHandler } from '../rental/CreateRentalCommand.js';
import { Equipment } from '../../../domain/entities/Equipment.js';
import { Member } from '../../../domain/entities/Member.js';
import { Reservation } from '../../../domain/entities/Reservation.js';
import { EquipmentId, MemberId } from '../../../domain/value-objects/identifiers.js';
import { Money } from '../../../domain/value-objects/Money.js';
import { DateRange } from '../../../domain/value-objects/DateRange.js';
import { EquipmentCondition } from '../../../domain/types/EquipmentCondition.js';
import { MembershipTier } from '../../../domain/types/MembershipTier.js';
import { EquipmentRepository } from '../../../domain/ports/EquipmentRepository.js';
import { MemberRepository } from '../../../domain/ports/MemberRepository.js';
import { RentalRepository } from '../../../domain/ports/RentalRepository.js';
import { ReservationRepository } from '../../../domain/ports/ReservationRepository.js';
import { EventPublisher } from '../../../domain/ports/EventPublisher.js';
import {
  EquipmentNotAvailableError,
  EquipmentNotFoundError,
} from '../../../domain/exceptions/EquipmentExceptions.js';
import {
  MemberNotFoundError,
  RentalLimitExceededError,
  MemberInactiveError,
} from '../../../domain/exceptions/MemberExceptions.js';

// Mock implementations
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

class InMemoryMemberRepository implements MemberRepository {
  private members = new Map<string, Member>();

  async findById(id: MemberId): Promise<Member | undefined> {
    return this.members.get(id.value);
  }

  async save(member: Member): Promise<void> {
    this.members.set(member.id.value, member);
  }

  async findAll(): Promise<Member[]> {
    return Array.from(this.members.values());
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

class InMemoryRentalRepository implements RentalRepository {
  private rentals = new Map<string, any>();

  async save(rental: any): Promise<void> {
    this.rentals.set(rental.id.value, rental);
  }

  async findById(): Promise<any> {
    return undefined;
  }
  async findAll(): Promise<any[]> {
    return [];
  }
  async findByMemberId(): Promise<any[]> {
    return [];
  }
  async findByEquipmentId(): Promise<any[]> {
    return [];
  }
  async findByStatus(): Promise<any[]> {
    return [];
  }
  async findActive(): Promise<any[]> {
    return [];
  }
  async findActiveByMemberId(): Promise<any[]> {
    return [];
  }
  async findActiveByEquipmentId(): Promise<any> {
    return undefined;
  }
  async findOverdue(): Promise<any[]> {
    return [];
  }
  async findEndingInPeriod(): Promise<any[]> {
    return [];
  }
  async findByCreatedDateRange(): Promise<any[]> {
    return [];
  }
  async findByReturnedDateRange(): Promise<any[]> {
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

class InMemoryReservationRepository implements ReservationRepository {
  private reservations = new Map<string, Reservation>();

  async findConflicting(equipmentId: EquipmentId, period: DateRange): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(
      (r) => r.equipmentId.value === equipmentId.value && r.overlaps(period) && r.isActive(),
    );
  }

  async save(reservation: Reservation): Promise<void> {
    this.reservations.set(reservation.id.value, reservation);
  }

  async findById(): Promise<Reservation | undefined> {
    return undefined;
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

class InMemoryEventPublisher implements EventPublisher {
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

describe('CreateRentalCommandHandler', () => {
  let handler: CreateRentalCommandHandler;
  let equipmentRepo: InMemoryEquipmentRepository;
  let memberRepo: InMemoryMemberRepository;
  let rentalRepo: InMemoryRentalRepository;
  let reservationRepo: InMemoryReservationRepository;
  let eventPublisher: InMemoryEventPublisher;

  beforeEach(() => {
    equipmentRepo = new InMemoryEquipmentRepository();
    memberRepo = new InMemoryMemberRepository();
    rentalRepo = new InMemoryRentalRepository();
    reservationRepo = new InMemoryReservationRepository();
    eventPublisher = new InMemoryEventPublisher();

    handler = new CreateRentalCommandHandler(
      equipmentRepo,
      memberRepo,
      rentalRepo,
      reservationRepo,
      eventPublisher,
    );
  });

  describe('Successful rental creation', () => {
    it('should create a rental with valid inputs', async () => {
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
      startDate.setDate(startDate.getDate() + 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 3);

      // Execute
      const result = await handler.execute({
        equipmentId: equipment.id.value,
        memberId: member.id.value,
        startDate,
        endDate,
      });

      // Assert
      expect(result.rentalId).toBeDefined();
      expect(result.totalCost).toBeGreaterThan(0);
      expect(result.discountApplied).toBeGreaterThan(0); // GOLD tier has discount
      expect(eventPublisher.getEvents()).toHaveLength(1);
      expect(eventPublisher.getEvents()[0].eventType).toBe('RentalCreated');
    });

    it('should apply member tier discount correctly', async () => {
      const equipment = Equipment.create({
        name: 'Drill',
        description: 'Power drill',
        category: 'Tools',
        dailyRate: Money.dollars(100),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      await equipmentRepo.save(equipment);

      const platinumMember = Member.create({
        name: 'Premium User',
        email: 'premium@example.com',
        tier: MembershipTier.PLATINUM,
        joinDate: new Date(),
        isActive: true,
      });
      await memberRepo.save(platinumMember);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 2); // 1 day rental

      const result = await handler.execute({
        equipmentId: equipment.id.value,
        memberId: platinumMember.id.value,
        startDate,
        endDate,
      });

      // PLATINUM gets 15% discount
      expect(result.discountApplied).toBe(15); // 15% of $100
      expect(result.totalCost).toBe(85); // $100 - $15
    });
  });

  describe('Validation errors', () => {
    it('should throw EquipmentNotFoundError when equipment does not exist', async () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });
      await memberRepo.save(member);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      await expect(
        handler.execute({
          equipmentId: 'non-existent-id',
          memberId: member.id.value,
          startDate,
          endDate,
        }),
      ).rejects.toThrow(EquipmentNotFoundError);
    });

    it('should throw EquipmentNotAvailableError when equipment is not available', async () => {
      const equipment = Equipment.create({
        name: 'Drill',
        description: 'Power drill',
        category: 'Tools',
        dailyRate: Money.dollars(50),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      equipment.markAsRented('some-rental-id');
      await equipmentRepo.save(equipment);

      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });
      await memberRepo.save(member);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      await expect(
        handler.execute({
          equipmentId: equipment.id.value,
          memberId: member.id.value,
          startDate,
          endDate,
        }),
      ).rejects.toThrow(EquipmentNotAvailableError);
    });

    it('should throw MemberNotFoundError when member does not exist', async () => {
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

      await expect(
        handler.execute({
          equipmentId: equipment.id.value,
          memberId: 'non-existent-member',
          startDate,
          endDate,
        }),
      ).rejects.toThrow(MemberNotFoundError);
    });

    it('should throw MemberInactiveError when member is not active', async () => {
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
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: false,
      });
      await memberRepo.save(member);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      await expect(
        handler.execute({
          equipmentId: equipment.id.value,
          memberId: member.id.value,
          startDate,
          endDate,
        }),
      ).rejects.toThrow(MemberInactiveError);
    });

    it('should throw RentalLimitExceededError when member has reached rental limit', async () => {
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
        tier: MembershipTier.BASIC, // BASIC tier allows 2 concurrent rentals
        joinDate: new Date(),
        isActive: true,
      });
      // Increment to max rentals
      member.incrementActiveRentals();
      member.incrementActiveRentals();
      await memberRepo.save(member);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      await expect(
        handler.execute({
          equipmentId: equipment.id.value,
          memberId: member.id.value,
          startDate,
          endDate,
        }),
      ).rejects.toThrow(RentalLimitExceededError);
    });

    it('should throw error when rental period exceeds member tier limit', async () => {
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
        tier: MembershipTier.BASIC, // BASIC tier allows max 7 days
        joinDate: new Date(),
        isActive: true,
      });
      await memberRepo.save(member);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 10); // 10 days exceeds BASIC limit

      await expect(
        handler.execute({
          equipmentId: equipment.id.value,
          memberId: member.id.value,
          startDate,
          endDate,
        }),
      ).rejects.toThrow(/exceeds member's maximum/);
    });

    it('should throw error when equipment has conflicting reservation', async () => {
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

      // Create a reservation
      const resStartDate = new Date();
      resStartDate.setDate(resStartDate.getDate() + 2);
      const resEndDate = new Date();
      resEndDate.setDate(resEndDate.getDate() + 5);
      const reservation = Reservation.create({
        equipmentId: equipment.id,
        memberId: member.id,
        period: DateRange.create(resStartDate, resEndDate),
      });
      reservation.confirm();
      await reservationRepo.save(reservation);

      // Try to rent during reserved period
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 3);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 4);

      await expect(
        handler.execute({
          equipmentId: equipment.id.value,
          memberId: member.id.value,
          startDate,
          endDate,
        }),
      ).rejects.toThrow(/reserved during the requested period/);
    });
  });
});
