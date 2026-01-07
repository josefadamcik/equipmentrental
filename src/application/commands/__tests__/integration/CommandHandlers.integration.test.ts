/**
 * Integration tests for command handlers using real in-memory adapters
 * Tests the full integration between application layer and adapter layer
 */

import { CreateRentalCommandHandler } from '../../rental/CreateRentalCommand.js';
import { ReturnRentalCommandHandler } from '../../rental/ReturnRentalCommand.js';
import { ExtendRentalCommandHandler } from '../../rental/ExtendRentalCommand.js';
import {
  CreateReservationCommandHandler,
  CreateReservationCommand,
} from '../../reservation/CreateReservationCommand.js';
import {
  CancelReservationCommandHandler,
  CancelReservationCommand,
} from '../../reservation/CancelReservationCommand.js';
import {
  AssessDamageCommandHandler,
  AssessDamageCommand,
} from '../../damage/AssessDamageCommand.js';

// Use actual in-memory adapters
import { InMemoryEquipmentRepository } from '../../../../adapters/outbound/persistence/InMemoryEquipmentRepository.js';
import { InMemoryMemberRepository } from '../../../../adapters/outbound/persistence/InMemoryMemberRepository.js';
import { InMemoryRentalRepository } from '../../../../adapters/outbound/persistence/InMemoryRentalRepository.js';
import { InMemoryReservationRepository } from '../../../../adapters/outbound/persistence/InMemoryReservationRepository.js';
import { InMemoryEventPublisher } from '../../../../adapters/outbound/events/InMemoryEventPublisher.js';

// Domain entities and value objects
import { Equipment } from '../../../../domain/entities/Equipment.js';
import { Member } from '../../../../domain/entities/Member.js';
import { Rental } from '../../../../domain/entities/Rental.js';
import { Reservation } from '../../../../domain/entities/Reservation.js';
import { Money } from '../../../../domain/value-objects/Money.js';
import { DateRange } from '../../../../domain/value-objects/DateRange.js';
import { EquipmentCondition } from '../../../../domain/types/EquipmentCondition.js';
import { MembershipTier } from '../../../../domain/types/MembershipTier.js';
import { RentalStatus } from '../../../../domain/types/RentalStatus.js';

// Domain exceptions
import {
  EquipmentNotFoundError,
  EquipmentNotAvailableError,
} from '../../../../domain/exceptions/EquipmentExceptions.js';
import {
  MemberNotFoundError,
  MemberInactiveError,
  RentalLimitExceededError,
} from '../../../../domain/exceptions/MemberExceptions.js';
import { RentalNotFoundError } from '../../../../domain/exceptions/RentalExceptions.js';

describe('Command Handlers Integration Tests', () => {
  let equipmentRepo: InMemoryEquipmentRepository;
  let memberRepo: InMemoryMemberRepository;
  let rentalRepo: InMemoryRentalRepository;
  let reservationRepo: InMemoryReservationRepository;
  let eventPublisher: InMemoryEventPublisher;

  beforeEach(() => {
    // Create fresh instances of all adapters
    equipmentRepo = new InMemoryEquipmentRepository();
    memberRepo = new InMemoryMemberRepository();
    rentalRepo = new InMemoryRentalRepository();
    reservationRepo = new InMemoryReservationRepository();
    eventPublisher = new InMemoryEventPublisher();
  });

  describe('CreateRentalCommandHandler Integration', () => {
    let handler: CreateRentalCommandHandler;

    beforeEach(() => {
      handler = new CreateRentalCommandHandler(
        equipmentRepo,
        memberRepo,
        rentalRepo,
        reservationRepo,
        eventPublisher,
      );
    });

    it('should create rental and persist all changes to repositories', async () => {
      // Setup
      const equipment = Equipment.create({
        name: 'Power Drill',
        description: 'Professional grade power drill',
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
      endDate.setDate(endDate.getDate() + 4);

      // Execute
      const result = await handler.execute({
        equipmentId: equipment.id.value,
        memberId: member.id.value,
        startDate,
        endDate,
      });

      // Verify result
      expect(result.rentalId).toBeDefined();
      expect(result.totalCost).toBeGreaterThan(0);
      expect(result.discountApplied).toBe(15); // GOLD tier gets 10% discount, 3 days * $50 = $150 * 0.1 = $15

      // Verify persistence - rental saved
      const savedRental = await rentalRepo.findById({ value: result.rentalId } as any);
      expect(savedRental).toBeDefined();
      expect(savedRental!.status).toBe(RentalStatus.ACTIVE);

      // Verify persistence - equipment marked as rented
      const updatedEquipment = await equipmentRepo.findById(equipment.id);
      expect(updatedEquipment!.isAvailable).toBe(false);
      expect(updatedEquipment!.currentRentalId).toBe(result.rentalId);

      // Verify persistence - member rental count incremented
      const updatedMember = await memberRepo.findById(member.id);
      expect(updatedMember!.activeRentalCount).toBe(1);

      // Event was published (we can't verify without subscribing handlers)
    });

    it('should apply member tier discount correctly', async () => {
      const equipment = Equipment.create({
        name: 'Excavator',
        description: 'Heavy equipment',
        category: 'Heavy Machinery',
        dailyRate: Money.dollars(500),
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
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1); // 1 day rental

      const result = await handler.execute({
        equipmentId: equipment.id.value,
        memberId: platinumMember.id.value,
        startDate,
        endDate,
      });

      // PLATINUM gets 15% discount: $500 * 0.15 = $75 discount
      expect(result.discountApplied).toBe(75);
      expect(result.totalCost).toBe(425); // $500 - $75
    });

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

    it('should throw EquipmentNotAvailableError when equipment is already rented', async () => {
      const equipment = Equipment.create({
        name: 'Drill',
        description: 'Power drill',
        category: 'Tools',
        dailyRate: Money.dollars(50),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      equipment.markAsRented('existing-rental-id');
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

    it('should throw MemberInactiveError when member is inactive', async () => {
      const equipment = Equipment.create({
        name: 'Drill',
        description: 'Power drill',
        category: 'Tools',
        dailyRate: Money.dollars(50),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      await equipmentRepo.save(equipment);

      const inactiveMember = Member.create({
        name: 'Inactive User',
        email: 'inactive@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: false,
      });
      await memberRepo.save(inactiveMember);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      await expect(
        handler.execute({
          equipmentId: equipment.id.value,
          memberId: inactiveMember.id.value,
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

      const basicMember = Member.create({
        name: 'Basic User',
        email: 'basic@example.com',
        tier: MembershipTier.BASIC, // BASIC allows 2 concurrent rentals
        joinDate: new Date(),
        isActive: true,
      });
      // Max out the rental count
      basicMember.incrementActiveRentals();
      basicMember.incrementActiveRentals();
      await memberRepo.save(basicMember);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      await expect(
        handler.execute({
          equipmentId: equipment.id.value,
          memberId: basicMember.id.value,
          startDate,
          endDate,
        }),
      ).rejects.toThrow(RentalLimitExceededError);
    });

    it('should reject rental when period exceeds member tier limit', async () => {
      const equipment = Equipment.create({
        name: 'Drill',
        description: 'Power drill',
        category: 'Tools',
        dailyRate: Money.dollars(50),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      await equipmentRepo.save(equipment);

      const basicMember = Member.create({
        name: 'Basic User',
        email: 'basic@example.com',
        tier: MembershipTier.BASIC, // BASIC allows max 7 days
        joinDate: new Date(),
        isActive: true,
      });
      await memberRepo.save(basicMember);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 10); // 10 days exceeds BASIC limit

      await expect(
        handler.execute({
          equipmentId: equipment.id.value,
          memberId: basicMember.id.value,
          startDate,
          endDate,
        }),
      ).rejects.toThrow(/exceeds member's maximum/);
    });

    it('should reject rental when equipment has conflicting reservation', async () => {
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

      // Create a conflicting reservation
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
      const rentalStartDate = new Date();
      rentalStartDate.setDate(rentalStartDate.getDate() + 3);
      const rentalEndDate = new Date();
      rentalEndDate.setDate(rentalEndDate.getDate() + 4);

      await expect(
        handler.execute({
          equipmentId: equipment.id.value,
          memberId: member.id.value,
          startDate: rentalStartDate,
          endDate: rentalEndDate,
        }),
      ).rejects.toThrow(/reserved during the requested period/);
    });
  });

  describe('ReturnRentalCommandHandler Integration', () => {
    let handler: ReturnRentalCommandHandler;

    beforeEach(() => {
      handler = new ReturnRentalCommandHandler(
        rentalRepo,
        equipmentRepo,
        memberRepo,
        eventPublisher,
      );
    });

    it('should return rental on time without fees', async () => {
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
      member.incrementActiveRentals();
      await memberRepo.save(member);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 2);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 2); // Ends in 2 days, so not overdue

      const rental = Rental.create({
        equipmentId: equipment.id,
        memberId: member.id,
        period: DateRange.create(startDate, endDate),
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

      // Verify result
      expect(result.rentalId).toBe(rental.id.value);
      expect(result.returnedAt).toBeDefined();
      expect(result.wasLate).toBe(false);
      expect(result.lateFees).toBe(0);
      expect(result.damageFees).toBe(0);
      expect(result.conditionChanged).toBe(false);

      // Verify persistence - rental returned
      const updatedRental = await rentalRepo.findById(rental.id);
      expect(updatedRental!.status).toBe(RentalStatus.RETURNED);
      expect(updatedRental!.returnedAt).toBeDefined();

      // Verify persistence - equipment marked as available
      const updatedEquipment = await equipmentRepo.findById(equipment.id);
      expect(updatedEquipment!.isAvailable).toBe(true);
      expect(updatedEquipment!.currentRentalId).toBeUndefined();

      // Verify persistence - member rental count decremented
      const updatedMember = await memberRepo.findById(member.id);
      expect(updatedMember!.activeRentalCount).toBe(0);
    });

    it('should calculate late fees for overdue rental', async () => {
      const equipment = Equipment.create({
        name: 'Drill',
        description: 'Power drill',
        category: 'Tools',
        dailyRate: Money.dollars(50),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      equipment.markAsRented('rental-id');
      await equipmentRepo.save(equipment);

      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.GOLD,
        joinDate: new Date(),
        isActive: true,
      });
      member.incrementActiveRentals();
      await memberRepo.save(member);

      // Create overdue rental (ended 3 days ago)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 10);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 3);

      const rental = Rental.create({
        equipmentId: equipment.id,
        memberId: member.id,
        period: DateRange.create(startDate, endDate),
        baseCost: Money.dollars(350),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      await rentalRepo.save(rental);

      // Execute
      const result = await handler.execute({
        rentalId: rental.id.value,
        conditionAtReturn: EquipmentCondition.EXCELLENT,
      });

      // Verify late fees applied
      expect(result.wasLate).toBe(true);
      expect(result.lateFees).toBeGreaterThan(0);
    });

    it('should apply damage fees when condition degrades', async () => {
      const equipment = Equipment.create({
        name: 'Drill',
        description: 'Power drill',
        category: 'Tools',
        dailyRate: Money.dollars(50),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      equipment.markAsRented('rental-id');
      await equipmentRepo.save(equipment);

      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.GOLD,
        joinDate: new Date(),
        isActive: true,
      });
      member.incrementActiveRentals();
      await memberRepo.save(member);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 2);

      const rental = Rental.create({
        equipmentId: equipment.id,
        memberId: member.id,
        period: DateRange.create(startDate, endDate),
        baseCost: Money.dollars(150),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      await rentalRepo.save(rental);

      // Execute - return in damaged condition
      const result = await handler.execute({
        rentalId: rental.id.value,
        conditionAtReturn: EquipmentCondition.DAMAGED,
      });

      // Verify damage fees applied
      expect(result.conditionChanged).toBe(true);
      expect(result.damageFees).toBeGreaterThan(0);

      // Verify equipment condition updated
      const updatedEquipment = await equipmentRepo.findById(equipment.id);
      expect(updatedEquipment!.condition).toBe(EquipmentCondition.DAMAGED);
    });

    it('should throw RentalNotFoundError when rental does not exist', async () => {
      await expect(
        handler.execute({
          rentalId: 'non-existent-rental',
          conditionAtReturn: EquipmentCondition.GOOD,
        }),
      ).rejects.toThrow(RentalNotFoundError);
    });
  });

  describe('ExtendRentalCommandHandler Integration', () => {
    let handler: ExtendRentalCommandHandler;

    beforeEach(() => {
      handler = new ExtendRentalCommandHandler(
        rentalRepo,
        equipmentRepo,
        memberRepo,
        reservationRepo,
      );
    });

    it('should extend rental and update total cost', async () => {
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
        tier: MembershipTier.GOLD, // 10% discount
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
        baseCost: Money.dollars(135), // 3 days * $50 * 0.9 (GOLD discount)
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      await rentalRepo.save(rental);

      const originalEndDate = new Date(rental.period.end);

      // Execute - extend by 2 days
      const result = await handler.execute({
        rentalId: rental.id.value,
        additionalDays: 2,
      });

      // Verify result
      expect(result.rentalId).toBe(rental.id.value);
      expect(result.extensionDays).toBe(2);
      expect(result.additionalCost).toBe(90); // 2 days * $50 * 0.9 = $90
      expect(result.newTotalCost).toBe(225); // $135 + $90

      // Verify new end date is 2 days later
      const expectedNewEndDate = new Date(originalEndDate);
      expectedNewEndDate.setDate(expectedNewEndDate.getDate() + 2);
      expect(result.newEndDate.getTime()).toBe(expectedNewEndDate.getTime());

      // Verify persistence
      const updatedRental = await rentalRepo.findById(rental.id);
      expect(updatedRental!.totalCost.amount).toBe(225);
      expect(updatedRental!.period.end.getTime()).toBe(expectedNewEndDate.getTime());
    });

    it('should reject extension when total days exceed member tier limit', async () => {
      const equipment = Equipment.create({
        name: 'Drill',
        description: 'Power drill',
        category: 'Tools',
        dailyRate: Money.dollars(50),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      await equipmentRepo.save(equipment);

      const basicMember = Member.create({
        name: 'Basic User',
        email: 'basic@example.com',
        tier: MembershipTier.BASIC, // Max 7 days
        joinDate: new Date(),
        isActive: true,
      });
      await memberRepo.save(basicMember);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 5); // 5 days

      const rental = Rental.create({
        equipmentId: equipment.id,
        memberId: basicMember.id,
        period: DateRange.create(startDate, endDate),
        baseCost: Money.dollars(250),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      await rentalRepo.save(rental);

      // Try to extend by 3 days (5 + 3 = 8 days > 7 day limit)
      await expect(
        handler.execute({
          rentalId: rental.id.value,
          additionalDays: 3,
        }),
      ).rejects.toThrow(/would exceed member's maximum/);
    });

    it('should reject extension when equipment has conflicting reservation', async () => {
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
        baseCost: Money.dollars(135),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      await rentalRepo.save(rental);

      // Create a reservation starting right after current rental
      const resStartDate = new Date(endDate);
      resStartDate.setDate(resStartDate.getDate() + 2);
      const resEndDate = new Date(resStartDate);
      resEndDate.setDate(resEndDate.getDate() + 3);

      const reservation = Reservation.create({
        equipmentId: equipment.id,
        memberId: member.id,
        period: DateRange.create(resStartDate, resEndDate),
      });
      reservation.confirm();
      await reservationRepo.save(reservation);

      // Try to extend rental into reservation period
      await expect(
        handler.execute({
          rentalId: rental.id.value,
          additionalDays: 3,
        }),
      ).rejects.toThrow(/equipment is reserved during the extension period/);
    });
  });

  describe('CreateReservationCommandHandler Integration', () => {
    let handler: CreateReservationCommandHandler;

    beforeEach(() => {
      handler = new CreateReservationCommandHandler(
        equipmentRepo,
        memberRepo,
        reservationRepo,
        eventPublisher,
      );
    });

    it('should create reservation and persist to repository', async () => {
      const equipment = Equipment.create({
        name: 'Excavator',
        description: 'Heavy equipment',
        category: 'Heavy Machinery',
        dailyRate: Money.dollars(500),
        condition: EquipmentCondition.EXCELLENT,
        purchaseDate: new Date(),
      });
      await equipmentRepo.save(equipment);

      const member = Member.create({
        name: 'Jane Smith',
        email: 'jane@example.com',
        tier: MembershipTier.PLATINUM,
        joinDate: new Date(),
        isActive: true,
      });
      await memberRepo.save(member);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 5);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 8);

      const command: CreateReservationCommand = {
        equipmentId: equipment.id.value,
        memberId: member.id.value,
        startDate,
        endDate,
      };

      // Execute
      const result = await handler.execute(command);

      // Verify result
      expect(result.reservationId).toBeDefined();
      expect(result.equipmentId).toBe(equipment.id.value);
      expect(result.memberId).toBe(member.id.value);
      expect(result.estimatedCost).toBe(1275); // 3 days * $500 * 0.85 (PLATINUM 15% discount)

      // Verify persistence
      const savedReservation = await reservationRepo.findById({
        value: result.reservationId,
      } as any);
      expect(savedReservation).toBeDefined();
      expect(savedReservation!.confirmedAt).toBeDefined();
    });

    it('should reject reservation when equipment has conflicting reservation', async () => {
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

      // Create existing reservation
      const existingStartDate = new Date();
      existingStartDate.setDate(existingStartDate.getDate() + 2);
      const existingEndDate = new Date();
      existingEndDate.setDate(existingEndDate.getDate() + 5);

      const existingReservation = Reservation.create({
        equipmentId: equipment.id,
        memberId: member.id,
        period: DateRange.create(existingStartDate, existingEndDate),
      });
      existingReservation.confirm();
      await reservationRepo.save(existingReservation);

      // Try to create conflicting reservation
      const newStartDate = new Date();
      newStartDate.setDate(newStartDate.getDate() + 3);
      const newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + 4);

      await expect(
        handler.execute({
          equipmentId: equipment.id.value,
          memberId: member.id.value,
          startDate: newStartDate,
          endDate: newEndDate,
        }),
      ).rejects.toThrow(/already reserved during the requested period/);
    });

    it('should reject reservation for past dates', async () => {
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

      const pastStartDate = new Date();
      pastStartDate.setDate(pastStartDate.getDate() - 5);
      const pastEndDate = new Date();
      pastEndDate.setDate(pastEndDate.getDate() - 2);

      await expect(
        handler.execute({
          equipmentId: equipment.id.value,
          memberId: member.id.value,
          startDate: pastStartDate,
          endDate: pastEndDate,
        }),
      ).rejects.toThrow(/must be for a future date/);
    });
  });

  describe('CancelReservationCommandHandler Integration', () => {
    let handler: CancelReservationCommandHandler;

    beforeEach(() => {
      handler = new CancelReservationCommandHandler(reservationRepo, eventPublisher);
    });

    it('should cancel reservation and update repository', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 5);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 8);

      const reservation = Reservation.create({
        equipmentId: { value: 'equipment-1' } as any,
        memberId: { value: 'member-1' } as any,
        period: DateRange.create(startDate, endDate),
      });
      reservation.confirm();
      await reservationRepo.save(reservation);

      const command: CancelReservationCommand = {
        reservationId: reservation.id.value,
        reason: 'Customer request',
      };

      // Execute
      const result = await handler.execute(command);

      // Verify result
      expect(result.reservationId).toBe(reservation.id.value);
      expect(result.cancelledAt).toBeDefined();

      // Verify persistence
      const updatedReservation = await reservationRepo.findById(reservation.id);
      expect(updatedReservation!.cancelledAt).toBeDefined();
    });
  });

  describe('AssessDamageCommandHandler Integration', () => {
    let handler: AssessDamageCommandHandler;

    beforeEach(() => {
      handler = new AssessDamageCommandHandler(rentalRepo, equipmentRepo);
    });

    it('should create damage assessment for returned rental', async () => {
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
      startDate.setDate(startDate.getDate() - 5);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 1);

      const rental = Rental.create({
        equipmentId: equipment.id,
        memberId: { value: 'member-1' } as any,
        period: DateRange.create(startDate, endDate),
        baseCost: Money.dollars(200),
        conditionAtStart: EquipmentCondition.EXCELLENT,
      });
      rental.returnRental(EquipmentCondition.DAMAGED);
      await rentalRepo.save(rental);

      const command: AssessDamageCommand = {
        rentalId: rental.id.value,
        equipmentId: equipment.id.value,
        conditionAfter: EquipmentCondition.DAMAGED,
        notes: 'Cracked housing - needs repair',
        assessedBy: 'Tech Smith',
      };

      // Execute
      const result = await handler.execute(command);

      // Verify result
      expect(result.assessmentId).toBeDefined();
      expect(result.rentalId).toBe(rental.id.value);
      expect(result.equipmentId).toBe(equipment.id.value);
      expect(result.conditionBefore).toBe(EquipmentCondition.EXCELLENT);
      expect(result.conditionAfter).toBe(EquipmentCondition.DAMAGED);
      expect(result.hasDamage).toBe(true);
      expect(result.damageFee).toBeGreaterThan(0);
      expect(result.degradationLevels).toBeGreaterThan(0);
      expect(result.notes).toBe('Cracked housing - needs repair');
      expect(result.assessedBy).toBe('Tech Smith');
    });
  });
});
