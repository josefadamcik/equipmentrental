import { ReturnRentalCommandHandler } from '../rental/ReturnRentalCommand.js';
import { Equipment } from '../../../domain/entities/Equipment.js';
import { Member } from '../../../domain/entities/Member.js';
import { Rental } from '../../../domain/entities/Rental.js';
import { EquipmentId, MemberId, RentalId } from '../../../domain/value-objects/identifiers.js';
import { Money } from '../../../domain/value-objects/Money.js';
import { DateRange } from '../../../domain/value-objects/DateRange.js';
import { EquipmentCondition } from '../../../domain/types/EquipmentCondition.js';
import { MembershipTier } from '../../../domain/types/MembershipTier.js';
import { EquipmentRepository } from '../../../domain/ports/EquipmentRepository.js';
import { MemberRepository } from '../../../domain/ports/MemberRepository.js';
import { RentalRepository } from '../../../domain/ports/RentalRepository.js';
import { EventPublisher } from '../../../domain/ports/EventPublisher.js';
import { RentalNotFoundError } from '../../../domain/exceptions/RentalExceptions.js';

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
  private rentals = new Map<string, Rental>();

  async findById(id: RentalId): Promise<Rental | undefined> {
    return this.rentals.get(id.value);
  }

  async save(rental: Rental): Promise<void> {
    this.rentals.set(rental.id.value, rental);
  }

  async findAll(): Promise<Rental[]> {
    return Array.from(this.rentals.values());
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

describe('ReturnRentalCommandHandler', () => {
  let handler: ReturnRentalCommandHandler;
  let equipmentRepo: InMemoryEquipmentRepository;
  let memberRepo: InMemoryMemberRepository;
  let rentalRepo: InMemoryRentalRepository;
  let eventPublisher: InMemoryEventPublisher;

  beforeEach(() => {
    equipmentRepo = new InMemoryEquipmentRepository();
    memberRepo = new InMemoryMemberRepository();
    rentalRepo = new InMemoryRentalRepository();
    eventPublisher = new InMemoryEventPublisher();

    handler = new ReturnRentalCommandHandler(rentalRepo, equipmentRepo, memberRepo, eventPublisher);
  });

  describe('Successful rental return', () => {
    it('should return a rental in good condition on time', async () => {
      // Setup equipment
      const equipment = Equipment.create({
        name: 'Drill',
        description: 'Power drill',
        category: 'Tools',
        dailyRate: Money.dollars(50),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      await equipmentRepo.save(equipment);

      // Setup member
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.GOLD,
        joinDate: new Date(),
        isActive: true,
      });
      member.incrementActiveRentals();
      await memberRepo.save(member);

      // Setup rental
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 2);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 2); // Still within period
      const period = DateRange.create(startDate, endDate);

      const rental = Rental.create({
        equipmentId: equipment.id,
        memberId: member.id,
        period,
        baseCost: Money.dollars(200),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      equipment.markAsRented(rental.id.value);
      await rentalRepo.save(rental);
      await equipmentRepo.save(equipment);

      // Execute
      const result = await handler.execute({
        rentalId: rental.id.value,
        conditionAtReturn: EquipmentCondition.EXCELLENT,
      });

      // Assert
      expect(result.rentalId).toBe(rental.id.value);
      expect(result.returnedAt).toBeDefined();
      expect(result.lateFees).toBe(0); // No late fees
      expect(result.damageFees).toBe(0); // No damage
      expect(result.wasLate).toBe(false);
      expect(result.conditionChanged).toBe(false);
      expect(eventPublisher.getEvents()).toHaveLength(1);
      expect(eventPublisher.getEvents()[0].eventType).toBe('RentalReturned');

      // Verify equipment is returned
      const updatedEquipment = await equipmentRepo.findById(equipment.id);
      expect(updatedEquipment?.isAvailable).toBe(true);

      // Verify member active rental count decreased
      const updatedMember = await memberRepo.findById(member.id);
      expect(updatedMember?.activeRentalCount).toBe(0);
    });

    it('should calculate late fees when returned late', async () => {
      // Setup equipment
      const equipment = Equipment.create({
        name: 'Drill',
        description: 'Power drill',
        category: 'Tools',
        dailyRate: Money.dollars(50),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      await equipmentRepo.save(equipment);

      // Setup member
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });
      member.incrementActiveRentals();
      await memberRepo.save(member);

      // Setup rental - ended 3 days ago
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 5);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 3); // Ended 3 days ago
      const period = DateRange.create(startDate, endDate);

      const rental = Rental.create({
        equipmentId: equipment.id,
        memberId: member.id,
        period,
        baseCost: Money.dollars(100),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      equipment.markAsRented(rental.id.value);
      await rentalRepo.save(rental);
      await equipmentRepo.save(equipment);

      // Execute
      const result = await handler.execute({
        rentalId: rental.id.value,
        conditionAtReturn: EquipmentCondition.EXCELLENT,
      });

      // Assert
      expect(result.wasLate).toBe(true);
      expect(result.lateFees).toBeGreaterThan(0);
      expect(result.lateFees).toBe(30); // 3 days * $10/day default late fee
    });

    it('should calculate damage fees when condition degraded', async () => {
      // Setup equipment
      const equipment = Equipment.create({
        name: 'Drill',
        description: 'Power drill',
        category: 'Tools',
        dailyRate: Money.dollars(50),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      await equipmentRepo.save(equipment);

      // Setup member
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.GOLD,
        joinDate: new Date(),
        isActive: true,
      });
      member.incrementActiveRentals();
      await memberRepo.save(member);

      // Setup rental
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 2);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 2);
      const period = DateRange.create(startDate, endDate);

      const rental = Rental.create({
        equipmentId: equipment.id,
        memberId: member.id,
        period,
        baseCost: Money.dollars(200),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      equipment.markAsRented(rental.id.value);
      await rentalRepo.save(rental);
      await equipmentRepo.save(equipment);

      // Execute - return in FAIR condition (2 levels degradation)
      const result = await handler.execute({
        rentalId: rental.id.value,
        conditionAtReturn: EquipmentCondition.FAIR,
      });

      // Assert
      expect(result.conditionChanged).toBe(true);
      expect(result.damageFees).toBe(50); // 2 levels degradation - 1 acceptable level = 1 * $50/level
    });
  });

  describe('Validation errors', () => {
    it('should throw RentalNotFoundError when rental does not exist', async () => {
      await expect(
        handler.execute({
          rentalId: 'non-existent-rental',
          conditionAtReturn: EquipmentCondition.EXCELLENT,
        }),
      ).rejects.toThrow(RentalNotFoundError);
    });
  });
});
