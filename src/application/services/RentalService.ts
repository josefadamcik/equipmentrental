import { EquipmentId, MemberId, RentalId } from '../../domain/value-objects/identifiers.js';
import { DateRange } from '../../domain/value-objects/DateRange.js';
import { Money } from '../../domain/value-objects/Money.js';
import { EquipmentRepository } from '../../domain/ports/EquipmentRepository.js';
import { MemberRepository } from '../../domain/ports/MemberRepository.js';
import { RentalRepository } from '../../domain/ports/RentalRepository.js';
import { ReservationRepository } from '../../domain/ports/ReservationRepository.js';
import { PaymentService, PaymentMethod } from '../../domain/ports/PaymentService.js';
import {
  NotificationService,
  NotificationChannel,
} from '../../domain/ports/NotificationService.js';
import { EventPublisher } from '../../domain/ports/EventPublisher.js';
import { Rental } from '../../domain/entities/Rental.js';
import { RentalCreated, RentalReturned, RentalOverdue } from '../../domain/events/RentalEvents.js';
import {
  EquipmentNotAvailableError,
  EquipmentNotFoundError,
  EquipmentConditionUnacceptableError,
} from '../../domain/exceptions/EquipmentExceptions.js';
import {
  MemberNotFoundError,
  RentalLimitExceededError,
  MemberInactiveError,
  MemberHasOverdueRentalsError,
} from '../../domain/exceptions/MemberExceptions.js';
import { getMaxConcurrentRentals } from '../../domain/types/MembershipTier.js';
import { EquipmentCondition, isRentable } from '../../domain/types/EquipmentCondition.js';

/**
 * Result of creating a rental with payment processing
 */
export interface CreateRentalWithPaymentResult {
  rentalId: string;
  totalCost: number;
  discountApplied: number;
  transactionId: string;
  paymentStatus: string;
}

/**
 * Result of returning a rental with payment processing
 */
export interface ReturnRentalWithPaymentResult {
  rentalId: string;
  totalCost: number;
  lateFee: number;
  damageFee: number;
  transactionId?: string;
  paymentStatus?: string;
  refundTransactionId?: string;
  refundAmount?: number;
}

/**
 * Result of extending a rental
 */
export interface ExtendRentalResult {
  rentalId: string;
  newEndDate: Date;
  additionalCost: number;
  transactionId: string;
  paymentStatus: string;
}

/**
 * Application service for orchestrating rental operations
 * Coordinates between domain entities, repositories, payments, and notifications
 */
export class RentalService {
  constructor(
    private readonly equipmentRepository: EquipmentRepository,
    private readonly memberRepository: MemberRepository,
    private readonly rentalRepository: RentalRepository,
    private readonly reservationRepository: ReservationRepository,
    private readonly paymentService: PaymentService,
    private readonly notificationService: NotificationService,
    private readonly eventPublisher: EventPublisher,
  ) {}

  /**
   * Create a new rental with complete payment processing and notifications
   * This orchestrates the entire rental creation workflow
   */
  async createRentalWithPayment(params: {
    equipmentId: string;
    memberId: string;
    startDate: Date;
    endDate: Date;
    paymentMethod: PaymentMethod;
    notificationChannel?: NotificationChannel;
  }): Promise<CreateRentalWithPaymentResult> {
    // Parse identifiers
    const equipmentId = EquipmentId.create(params.equipmentId);
    const memberId = MemberId.create(params.memberId);
    const period = DateRange.create(params.startDate, params.endDate);

    // Validate equipment exists and is available
    const equipment = await this.equipmentRepository.findById(equipmentId);
    if (!equipment) {
      throw new EquipmentNotFoundError(equipmentId.value);
    }

    if (!equipment.isAvailable) {
      throw new EquipmentNotAvailableError(equipmentId.value, 'Equipment is currently rented');
    }

    // Validate equipment condition is acceptable for rental
    if (!isRentable(equipment.condition)) {
      throw new EquipmentConditionUnacceptableError(equipmentId.value, equipment.condition);
    }

    // Validate member exists and can rent
    const member = await this.memberRepository.findById(memberId);
    if (!member) {
      throw new MemberNotFoundError(memberId.value);
    }

    if (!member.isActive) {
      throw new MemberInactiveError(memberId.value);
    }

    // Check for overdue rentals
    const memberRentals = await this.rentalRepository.findByMemberId(memberId);
    const overdueRentals = memberRentals.filter((rental) => rental.isOverdue());
    if (overdueRentals.length > 0) {
      throw new MemberHasOverdueRentalsError(memberId.value, overdueRentals.length);
    }

    if (!member.canRent()) {
      const maxRentals = getMaxConcurrentRentals(member.tier);
      throw new RentalLimitExceededError(memberId.value, member.activeRentalCount, maxRentals);
    }

    // Validate rental period is within member's tier limits
    const maxRentalDays = member.getMaxRentalDays();
    if (period.getDays() > maxRentalDays) {
      throw new Error(
        `Rental period of ${period.getDays()} days exceeds member's maximum of ${maxRentalDays} days`,
      );
    }

    // Check for conflicting reservations
    const conflictingReservations = await this.reservationRepository.findConflicting(
      equipmentId,
      period,
    );
    if (conflictingReservations.length > 0) {
      throw new Error(
        `Equipment is reserved during the requested period. ${conflictingReservations.length} conflicting reservation(s) found.`,
      );
    }

    // Calculate rental cost with member discount
    const baseCost = equipment.calculateRentalCost(period.getDays());
    const discountedCost = member.applyDiscount(baseCost);
    const discountAmount = baseCost.amount - discountedCost.amount;

    // Process payment
    const paymentResult = await this.paymentService.processPayment(
      RentalId.generate(), // Temporary ID for payment
      memberId,
      discountedCost,
      params.paymentMethod,
      `Rental payment for ${equipment.name} (${period.getDays()} days)`,
    );

    if (paymentResult.status !== 'SUCCESS') {
      // Notify member of payment failure
      await this.notificationService.notifyPaymentFailed(
        memberId,
        discountedCost,
        paymentResult.errorMessage || 'Payment processing failed',
        params.notificationChannel,
      );

      throw new Error(`Payment failed: ${paymentResult.errorMessage || 'Unknown error'}`);
    }

    // Create rental
    const rental = Rental.create({
      equipmentId,
      memberId,
      period,
      baseCost: discountedCost,
      conditionAtStart: equipment.condition,
    });

    // Mark equipment as rented
    equipment.markAsRented(rental.id.value);

    // Increment member's active rental count
    member.incrementActiveRentals();

    // Persist changes
    await this.rentalRepository.save(rental);
    await this.equipmentRepository.save(equipment);
    await this.memberRepository.save(member);

    // Publish domain event
    const event = RentalCreated.create(
      rental.id,
      memberId,
      equipmentId,
      period,
      equipment.dailyRate,
    );
    await this.eventPublisher.publish(event);

    // Send notifications
    await this.notificationService.notifyRentalCreated(
      memberId,
      rental.id,
      equipment.name,
      params.startDate,
      params.endDate,
      discountedCost,
      params.notificationChannel,
    );

    await this.notificationService.notifyPaymentReceived(
      memberId,
      paymentResult.transactionId,
      discountedCost,
      `Rental payment for ${equipment.name}`,
      params.notificationChannel,
    );

    return {
      rentalId: rental.id.value,
      totalCost: rental.totalCost.amount,
      discountApplied: discountAmount,
      transactionId: paymentResult.transactionId,
      paymentStatus: paymentResult.status,
    };
  }

  /**
   * Return a rental with payment processing for fees and notifications
   * Handles late fees, damage fees, and refunds if applicable
   */
  async returnRentalWithPayment(params: {
    rentalId: string;
    conditionAtReturn: EquipmentCondition;
    paymentMethod?: PaymentMethod;
    notificationChannel?: NotificationChannel;
  }): Promise<ReturnRentalWithPaymentResult> {
    const rentalId = RentalId.create(params.rentalId);

    // Find rental
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) {
      throw new Error(`Rental not found: ${params.rentalId}`);
    }

    // Find equipment
    const equipment = await this.equipmentRepository.findById(rental.equipmentId);
    if (!equipment) {
      throw new EquipmentNotFoundError(rental.equipmentId.value);
    }

    // Find member
    const member = await this.memberRepository.findById(rental.memberId);
    if (!member) {
      throw new MemberNotFoundError(rental.memberId.value);
    }

    // Calculate damage fee
    const damageFee = rental.calculateDamageFee(params.conditionAtReturn);

    // Return rental (this calculates late fees internally)
    const now = new Date();
    rental.returnRental(params.conditionAtReturn, damageFee, now);

    // Update equipment condition and make available
    equipment.markAsReturned(params.conditionAtReturn);

    // Decrement member's active rental count
    member.decrementActiveRentals();

    // Calculate additional fees
    const lateFee = rental.lateFee;
    const additionalFees = lateFee.add(damageFee);

    let paymentTransactionId: string | undefined;
    let paymentStatus: string | undefined;
    let refundTransactionId: string | undefined;
    let refundAmount: number | undefined;

    // Process additional fees if any
    if (additionalFees.amount > 0 && params.paymentMethod) {
      const paymentResult = await this.paymentService.processPayment(
        rentalId,
        rental.memberId,
        additionalFees,
        params.paymentMethod,
        `Late fees and damage fees for ${equipment.name}`,
      );

      paymentTransactionId = paymentResult.transactionId;
      paymentStatus = paymentResult.status;

      if (paymentResult.status !== 'SUCCESS') {
        // Notify member of payment failure
        await this.notificationService.notifyPaymentFailed(
          rental.memberId,
          additionalFees,
          paymentResult.errorMessage || 'Payment processing failed',
          params.notificationChannel,
        );
      } else {
        // Notify member of payment received
        await this.notificationService.notifyPaymentReceived(
          rental.memberId,
          paymentResult.transactionId,
          additionalFees,
          `Late fees and damage fees for ${equipment.name}`,
          params.notificationChannel,
        );
      }
    }

    // Persist changes
    await this.rentalRepository.save(rental);
    await this.equipmentRepository.save(equipment);
    await this.memberRepository.save(member);

    // Publish domain event
    const event = RentalReturned.create(rental.id, now, lateFee, rental.totalCost);
    await this.eventPublisher.publish(event);

    // Send return notification
    await this.notificationService.notifyRentalReturned(
      rental.memberId,
      rental.id,
      equipment.name,
      now,
      rental.totalCost,
      params.notificationChannel,
    );

    // Notify about damage if applicable
    if (damageFee.amount > 0) {
      await this.notificationService.notifyEquipmentDamaged(
        rental.memberId,
        rental.equipmentId,
        equipment.name,
        damageFee,
        `Equipment returned in ${params.conditionAtReturn} condition`,
        params.notificationChannel,
      );
    }

    return {
      rentalId: rental.id.value,
      totalCost: rental.totalCost.amount,
      lateFee: lateFee.amount,
      damageFee: damageFee.amount,
      transactionId: paymentTransactionId,
      paymentStatus,
      refundTransactionId,
      refundAmount,
    };
  }

  /**
   * Process overdue rentals and send notifications
   * This is typically called by a scheduled job
   */
  async processOverdueRentals(
    dailyLateFeeRate: Money = Money.dollars(10),
  ): Promise<{ rentalId: string; daysOverdue: number; lateFee: number }[]> {
    const now = new Date();
    const activeRentals = await this.rentalRepository.findActive();
    const overdueResults: { rentalId: string; daysOverdue: number; lateFee: number }[] = [];

    for (const rental of activeRentals) {
      if (rental.isOverdue(now)) {
        // Mark as overdue
        rental.markAsOverdue(dailyLateFeeRate, now);

        // Save rental
        await this.rentalRepository.save(rental);

        // Calculate days overdue
        const daysOverdue = Math.abs(rental.period.getDaysUntilEnd(now));

        // Find equipment for notification
        const equipment = await this.equipmentRepository.findById(rental.equipmentId);
        if (equipment) {
          // Send overdue notification
          await this.notificationService.notifyRentalOverdue(
            rental.memberId,
            rental.id,
            equipment.name,
            daysOverdue,
            rental.lateFee,
          );
        }

        // Publish domain event
        const event = RentalOverdue.create(
          rental.id,
          rental.memberId,
          rental.equipmentId,
          daysOverdue,
          rental.lateFee,
        );
        await this.eventPublisher.publish(event);

        overdueResults.push({
          rentalId: rental.id.value,
          daysOverdue,
          lateFee: rental.lateFee.amount,
        });
      }
    }

    return overdueResults;
  }

  /**
   * Extend a rental period with payment processing
   */
  async extendRental(params: {
    rentalId: string;
    additionalDays: number;
    paymentMethod: PaymentMethod;
    notificationChannel?: NotificationChannel;
  }): Promise<ExtendRentalResult> {
    const rentalId = RentalId.create(params.rentalId);

    // Find rental
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) {
      throw new Error(`Rental not found: ${params.rentalId}`);
    }

    // Find equipment
    const equipment = await this.equipmentRepository.findById(rental.equipmentId);
    if (!equipment) {
      throw new EquipmentNotFoundError(rental.equipmentId.value);
    }

    // Find member
    const member = await this.memberRepository.findById(rental.memberId);
    if (!member) {
      throw new MemberNotFoundError(rental.memberId.value);
    }

    // Calculate additional cost
    const additionalCost = equipment.calculateRentalCost(params.additionalDays);
    const discountedAdditionalCost = member.applyDiscount(additionalCost);

    // Process payment
    const paymentResult = await this.paymentService.processPayment(
      rentalId,
      rental.memberId,
      discountedAdditionalCost,
      params.paymentMethod,
      `Rental extension for ${equipment.name} (${params.additionalDays} days)`,
    );

    if (paymentResult.status !== 'SUCCESS') {
      // Notify member of payment failure
      await this.notificationService.notifyPaymentFailed(
        rental.memberId,
        discountedAdditionalCost,
        paymentResult.errorMessage || 'Payment processing failed',
        params.notificationChannel,
      );

      throw new Error(`Payment failed: ${paymentResult.errorMessage || 'Unknown error'}`);
    }

    // Extend rental period
    rental.extendPeriod(params.additionalDays, discountedAdditionalCost);

    // Save rental
    await this.rentalRepository.save(rental);

    // Notify member
    await this.notificationService.notifyPaymentReceived(
      rental.memberId,
      paymentResult.transactionId,
      discountedAdditionalCost,
      `Rental extension for ${equipment.name}`,
      params.notificationChannel,
    );

    return {
      rentalId: rental.id.value,
      newEndDate: rental.period.end,
      additionalCost: discountedAdditionalCost.amount,
      transactionId: paymentResult.transactionId,
      paymentStatus: paymentResult.status,
    };
  }

  /**
   * Send rental due reminders for rentals ending soon
   * This is typically called by a scheduled job
   */
  async sendRentalDueReminders(
    daysBeforeDue: number = 2,
  ): Promise<{ rentalId: string; memberId: string; dueDate: Date }[]> {
    const now = new Date();
    const activeRentals = await this.rentalRepository.findActive();
    const reminders: { rentalId: string; memberId: string; dueDate: Date }[] = [];

    for (const rental of activeRentals) {
      const daysUntilDue = rental.period.getDaysUntilEnd(now);

      // Send reminder if rental is due within the specified days
      if (daysUntilDue >= 0 && daysUntilDue <= daysBeforeDue) {
        const equipment = await this.equipmentRepository.findById(rental.equipmentId);
        if (equipment) {
          await this.notificationService.notifyRentalDueSoon(
            rental.memberId,
            rental.id,
            equipment.name,
            rental.period.end,
            daysUntilDue,
          );

          reminders.push({
            rentalId: rental.id.value,
            memberId: rental.memberId.value,
            dueDate: rental.period.end,
          });
        }
      }
    }

    return reminders;
  }
}
