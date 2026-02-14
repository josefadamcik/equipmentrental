import { EquipmentId, MemberId, ReservationId } from '../../domain/value-objects/identifiers.js';
import { DateRange } from '../../domain/value-objects/DateRange.js';
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
import { Reservation, ReservationStatus } from '../../domain/entities/Reservation.js';
import { Rental } from '../../domain/entities/Rental.js';
import { ReservationCreated, ReservationCancelled } from '../../domain/events/ReservationEvents.js';
import { RentalCreated } from '../../domain/events/RentalEvents.js';
import {
  EquipmentNotAvailableError,
  EquipmentNotFoundError,
} from '../../domain/exceptions/EquipmentExceptions.js';
import {
  MemberNotFoundError,
  RentalLimitExceededError,
  MemberInactiveError,
  MemberHasOverdueRentalsError,
} from '../../domain/exceptions/MemberExceptions.js';
import {
  ReservationNotFoundError,
  ReservationAlreadyCancelledError,
  InvalidReservationStateError,
} from '../../domain/exceptions/ReservationExceptions.js';
import { getMaxConcurrentRentals } from '../../domain/types/MembershipTier.js';

/**
 * Result of creating a reservation
 */
export interface CreateReservationResult {
  reservationId: string;
  equipmentName: string;
  startDate: Date;
  endDate: Date;
  authorizationId?: string;
  totalCost?: number;
  discountApplied?: number;
}

/**
 * Result of cancelling a reservation
 */
export interface CancelReservationResult {
  reservationId: string;
  cancelledAt: Date;
  refundAmount?: number;
  refundTransactionId?: string;
}

/**
 * Result of fulfilling a reservation (converting to rental)
 */
export interface FulfillReservationResult {
  reservationId: string;
  rentalId: string;
  totalCost: number;
  transactionId: string;
  paymentStatus: string;
}

/**
 * Application service for orchestrating reservation operations
 * Coordinates between domain entities, repositories, payments, and notifications
 */
export class ReservationService {
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
   * Create a new reservation with conflict checking and optional payment authorization
   */
  async createReservation(params: {
    equipmentId: string;
    memberId: string;
    startDate: Date;
    endDate: Date;
    paymentMethod?: PaymentMethod;
    authorizePayment?: boolean;
    notificationChannel?: NotificationChannel;
  }): Promise<CreateReservationResult> {
    // Parse identifiers
    const equipmentId = EquipmentId.create(params.equipmentId);
    const memberId = MemberId.create(params.memberId);
    const period = DateRange.create(params.startDate, params.endDate);

    // Validate equipment exists
    const equipment = await this.equipmentRepository.findById(equipmentId);
    if (!equipment) {
      throw new EquipmentNotFoundError(equipmentId.value);
    }

    // Validate member exists and is active
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

    // Validate rental period is within member's tier limits
    const maxRentalDays = member.getMaxRentalDays();
    if (period.getDays() > maxRentalDays) {
      throw new Error(
        `Reservation period of ${period.getDays()} days exceeds member's maximum of ${maxRentalDays} days`,
      );
    }

    // Check for conflicting reservations
    const conflictingReservations = await this.reservationRepository.findConflicting(
      equipmentId,
      period,
    );
    if (conflictingReservations.length > 0) {
      throw new EquipmentNotAvailableError(
        params.equipmentId,
        `Equipment is already reserved during the requested period. ${conflictingReservations.length} conflicting reservation(s) found.`,
      );
    }

    // Check for conflicting active rentals
    const equipmentRentals = await this.rentalRepository.findByEquipmentId(equipmentId);
    const hasConflictingRental = equipmentRentals.some(
      (rental) => rental.status === 'ACTIVE' && rental.period.overlaps(period),
    );
    if (hasConflictingRental) {
      throw new EquipmentNotAvailableError(
        params.equipmentId,
        'Equipment is rented during the requested reservation period',
      );
    }

    // Create reservation
    const reservation = Reservation.create({
      equipmentId,
      memberId,
      period,
    });

    // Calculate estimated cost and discount
    const estimatedCost = equipment.calculateRentalCost(period.getDays());
    const discountedCost = member.applyDiscount(estimatedCost);
    const discountAmount = estimatedCost.amount - discountedCost.amount;

    // Authorize payment if requested
    let authorizationId: string | undefined;
    if (params.authorizePayment && params.paymentMethod) {
      const authResult = await this.paymentService.authorizePayment(
        memberId,
        discountedCost,
        params.paymentMethod,
      );

      if (authResult.status === 'SUCCESS' || authResult.status === 'PENDING') {
        authorizationId = authResult.transactionId;
        // Auto-confirm reservation if payment authorized
        reservation.confirm();
      }
    }

    // Save reservation
    await this.reservationRepository.save(reservation);

    // Publish domain event
    const event = ReservationCreated.create(reservation.id, memberId, equipmentId, period);
    await this.eventPublisher.publish(event);

    // Send notification
    await this.notificationService.notifyReservationCreated(
      memberId,
      reservation.id,
      equipment.name,
      params.startDate,
      params.endDate,
      params.notificationChannel,
    );

    return {
      reservationId: reservation.id.value,
      equipmentName: equipment.name,
      startDate: params.startDate,
      endDate: params.endDate,
      authorizationId,
      totalCost: discountedCost.amount,
      discountApplied: discountAmount,
    };
  }

  /**
   * Cancel a reservation and process any refunds
   */
  async cancelReservation(params: {
    reservationId: string;
    reason?: string;
    authorizationId?: string;
    notificationChannel?: NotificationChannel;
  }): Promise<CancelReservationResult> {
    const reservationId = ReservationId.create(params.reservationId);

    // Find reservation
    const reservation = await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new ReservationNotFoundError(params.reservationId);
    }

    // Check if reservation is already cancelled
    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new ReservationAlreadyCancelledError(params.reservationId);
    }

    // Find equipment for notification
    const equipment = await this.equipmentRepository.findById(reservation.equipmentId);
    if (!equipment) {
      throw new EquipmentNotFoundError(reservation.equipmentId.value);
    }

    // Cancel reservation
    const now = new Date();
    reservation.cancel(now);

    // Cancel payment authorization if provided
    let refundTransactionId: string | undefined;
    let refundAmount: number | undefined;
    if (params.authorizationId) {
      try {
        const cancelResult = await this.paymentService.cancelAuthorization(params.authorizationId);
        refundTransactionId = cancelResult.transactionId;
        refundAmount = cancelResult.amount.amount;
      } catch (error) {
        // Log error but don't fail the cancellation
        console.error('Failed to cancel payment authorization:', error);
      }
    }

    // Save reservation
    await this.reservationRepository.save(reservation);

    // Publish domain event
    const event = ReservationCancelled.create(
      reservation.id,
      reservation.equipmentId,
      params.reason,
    );
    await this.eventPublisher.publish(event);

    // Send notification
    await this.notificationService.notifyReservationCancelled(
      reservation.memberId,
      reservation.id,
      equipment.name,
      params.reason,
      params.notificationChannel,
    );

    return {
      reservationId: reservation.id.value,
      cancelledAt: now,
      refundAmount,
      refundTransactionId,
    };
  }

  /**
   * Fulfill a reservation by converting it to a rental
   * This is typically called when the reservation start date arrives
   */
  async fulfillReservation(params: {
    reservationId: string;
    paymentMethod: PaymentMethod;
    authorizationId?: string;
    notificationChannel?: NotificationChannel;
  }): Promise<FulfillReservationResult> {
    const reservationId = ReservationId.create(params.reservationId);

    // Find reservation
    const reservation = await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new ReservationNotFoundError(params.reservationId);
    }

    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new InvalidReservationStateError(
        params.reservationId, reservation.status, 'Only confirmed reservations can be fulfilled',
      );
    }

    // Find equipment
    const equipment = await this.equipmentRepository.findById(reservation.equipmentId);
    if (!equipment) {
      throw new EquipmentNotFoundError(reservation.equipmentId.value);
    }

    if (!equipment.isAvailable) {
      throw new EquipmentNotAvailableError(
        reservation.equipmentId.value,
        'Equipment is not available',
      );
    }

    // Find member
    const member = await this.memberRepository.findById(reservation.memberId);
    if (!member) {
      throw new MemberNotFoundError(reservation.memberId.value);
    }

    if (!member.isActive) {
      throw new MemberInactiveError(reservation.memberId.value);
    }

    if (!member.canRent()) {
      const maxRentals = getMaxConcurrentRentals(member.tier);
      throw new RentalLimitExceededError(
        reservation.memberId.value,
        member.activeRentalCount,
        maxRentals,
      );
    }

    // Calculate rental cost
    const baseCost = equipment.calculateRentalCost(reservation.period.getDays());
    const discountedCost = member.applyDiscount(baseCost);

    // Process payment (capture authorization or new payment)
    let paymentResult;
    if (params.authorizationId) {
      paymentResult = await this.paymentService.capturePayment(
        params.authorizationId,
        discountedCost,
      );
    } else {
      paymentResult = await this.paymentService.processPayment(
        reservation.id, // Use reservation ID as temporary rental ID
        reservation.memberId,
        discountedCost,
        params.paymentMethod,
        `Rental payment for ${equipment.name} (reservation ${reservation.id.value})`,
      );
    }

    if (paymentResult.status !== 'SUCCESS') {
      // Notify member of payment failure
      await this.notificationService.notifyPaymentFailed(
        reservation.memberId,
        discountedCost,
        paymentResult.errorMessage || 'Payment processing failed',
        params.notificationChannel,
      );

      throw new Error(`Payment failed: ${paymentResult.errorMessage || 'Unknown error'}`);
    }

    // Create rental
    const rental = Rental.create({
      equipmentId: reservation.equipmentId,
      memberId: reservation.memberId,
      period: reservation.period,
      baseCost: discountedCost,
      conditionAtStart: equipment.condition,
    });

    // Mark equipment as rented
    equipment.markAsRented(rental.id.value);

    // Increment member's active rental count
    member.incrementActiveRentals();

    // Mark reservation as fulfilled
    reservation.fulfill();

    // Persist changes
    await this.rentalRepository.save(rental);
    await this.equipmentRepository.save(equipment);
    await this.memberRepository.save(member);
    await this.reservationRepository.save(reservation);

    // Publish domain events
    const rentalEvent = RentalCreated.create(
      rental.id,
      reservation.memberId,
      reservation.equipmentId,
      reservation.period,
      equipment.dailyRate,
    );
    await this.eventPublisher.publish(rentalEvent);

    // Send notifications
    await this.notificationService.notifyRentalCreated(
      reservation.memberId,
      rental.id,
      equipment.name,
      reservation.period.start,
      reservation.period.end,
      discountedCost,
      params.notificationChannel,
    );

    await this.notificationService.notifyPaymentReceived(
      reservation.memberId,
      paymentResult.transactionId,
      discountedCost,
      `Rental payment for ${equipment.name}`,
      params.notificationChannel,
    );

    return {
      reservationId: reservation.id.value,
      rentalId: rental.id.value,
      totalCost: rental.totalCost.amount,
      transactionId: paymentResult.transactionId,
      paymentStatus: paymentResult.status,
    };
  }

  /**
   * Send reservation reminders for upcoming reservations
   * This is typically called by a scheduled job
   */
  async sendReservationReminders(
    daysBeforeStart: number = 1,
  ): Promise<{ reservationId: string; memberId: string; startDate: Date }[]> {
    const now = new Date();
    const confirmedReservations = await this.reservationRepository.findByStatus(
      ReservationStatus.CONFIRMED,
    );
    const reminders: { reservationId: string; memberId: string; startDate: Date }[] = [];

    for (const reservation of confirmedReservations) {
      const diffTime = reservation.period.start.getTime() - now.getTime();
      const daysUntilStart = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Send reminder if reservation starts within the specified days
      if (daysUntilStart >= 0 && daysUntilStart <= daysBeforeStart) {
        const equipment = await this.equipmentRepository.findById(reservation.equipmentId);
        if (equipment) {
          await this.notificationService.notifyReservationReminder(
            reservation.memberId,
            reservation.id,
            equipment.name,
            reservation.period.start,
            daysUntilStart,
          );

          reminders.push({
            reservationId: reservation.id.value,
            memberId: reservation.memberId.value,
            startDate: reservation.period.start,
          });
        }
      }
    }

    return reminders;
  }

  /**
   * Process expired reservations
   * This is typically called by a scheduled job
   */
  async processExpiredReservations(): Promise<{ reservationId: string; expiredAt: Date }[]> {
    const now = new Date();
    const activeReservations = await this.reservationRepository.findActive();
    const expired: { reservationId: string; expiredAt: Date }[] = [];

    for (const reservation of activeReservations) {
      // Mark as expired if the period has ended and not yet fulfilled
      if (reservation.period.hasEnded(now) && !reservation.isReadyToFulfill(now)) {
        reservation.markAsExpired(now);
        await this.reservationRepository.save(reservation);

        // Find equipment for notification
        const equipment = await this.equipmentRepository.findById(reservation.equipmentId);
        if (equipment) {
          await this.notificationService.notifyReservationCancelled(
            reservation.memberId,
            reservation.id,
            equipment.name,
            'Reservation expired - not fulfilled by start date',
          );
        }

        expired.push({
          reservationId: reservation.id.value,
          expiredAt: now,
        });
      }
    }

    return expired;
  }

  /**
   * Confirm a pending reservation
   */
  async confirmReservation(params: {
    reservationId: string;
    notificationChannel?: NotificationChannel;
  }): Promise<{ reservationId: string; confirmedAt: Date }> {
    const reservationId = ReservationId.create(params.reservationId);

    // Find reservation
    const reservation = await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new ReservationNotFoundError(params.reservationId);
    }

    // Confirm reservation
    const now = new Date();
    reservation.confirm(now);

    // Save reservation
    await this.reservationRepository.save(reservation);

    // Find equipment for notification
    const equipment = await this.equipmentRepository.findById(reservation.equipmentId);
    if (equipment) {
      await this.notificationService.notifyReservationCreated(
        reservation.memberId,
        reservation.id,
        equipment.name,
        reservation.period.start,
        reservation.period.end,
        params.notificationChannel,
      );
    }

    return {
      reservationId: reservation.id.value,
      confirmedAt: now,
    };
  }
}
