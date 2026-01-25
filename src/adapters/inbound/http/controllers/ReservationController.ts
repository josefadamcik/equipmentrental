import { Request, Response, NextFunction, Router } from 'express';
import { ReservationService } from '../../../../application/services/ReservationService.js';
import { ReservationRepository } from '../../../../domain/ports/ReservationRepository.js';
import { ReservationId } from '../../../../domain/value-objects/identifiers.js';
import { PaymentMethod } from '../../../../domain/ports/PaymentService.js';
import { NotificationChannel } from '../../../../domain/ports/NotificationService.js';
import {
  CreateReservationRequest,
  CreateReservationResponse,
  CancelReservationRequest,
  CancelReservationResponse,
  ConfirmReservationRequest,
  ConfirmReservationResponse,
  FulfillReservationRequest,
  FulfillReservationResponse,
  GetReservationResponse,
} from '../dtos/ReservationDTOs.js';

/**
 * HTTP Controller for Reservation operations
 * Handles REST API endpoints for reservation management
 */
export class ReservationController {
  private router: Router;

  constructor(
    private readonly reservationService: ReservationService,
    private readonly reservationRepository: ReservationRepository,
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  /**
   * Setup all routes for reservation operations
   */
  private setupRoutes(): void {
    // POST /api/reservations - Create a new reservation
    this.router.post('/', this.createReservation.bind(this));

    // GET /api/reservations/:reservationId - Get reservation details
    this.router.get('/:reservationId', this.getReservation.bind(this));

    // DELETE /api/reservations/:reservationId - Cancel a reservation (RESTful)
    this.router.delete('/:reservationId', this.cancelReservation.bind(this));

    // PUT /api/reservations/:reservationId/cancel - Cancel a reservation (alternative)
    this.router.put('/:reservationId/cancel', this.cancelReservation.bind(this));

    // PUT /api/reservations/:reservationId/confirm - Confirm a reservation
    this.router.put('/:reservationId/confirm', this.confirmReservation.bind(this));

    // POST /api/reservations/:reservationId/fulfill - Fulfill a reservation
    this.router.post('/:reservationId/fulfill', this.fulfillReservation.bind(this));
  }

  /**
   * Get the Express router
   */
  public getRouter(): Router {
    return this.router;
  }

  /**
   * POST /api/reservations
   * Create a new reservation
   */
  private async createReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as CreateReservationRequest;

      // Validate required fields
      if (!body.equipmentId || !body.memberId || !body.startDate || !body.endDate) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: equipmentId, memberId, startDate, endDate',
          },
        });
        return;
      }

      // Parse dates
      const startDate = new Date(body.startDate);
      const endDate = new Date(body.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid date format. Use ISO 8601 format.',
          },
        });
        return;
      }

      // Map payment method if provided (currently we just use the type, token handling would be in payment adapter)
      let paymentMethod: PaymentMethod | undefined;
      if (body.paymentMethod) {
        paymentMethod = body.paymentMethod.type as PaymentMethod;
      }

      // Map notification channel
      const notificationChannel: NotificationChannel | undefined = body.notificationChannel;

      // If payment method is provided and authorizePayment is not explicitly false, authorize payment
      const authorizePayment = paymentMethod ? body.authorizePayment !== false : false;

      // Create reservation
      const result = await this.reservationService.createReservation({
        equipmentId: body.equipmentId,
        memberId: body.memberId,
        startDate,
        endDate,
        paymentMethod,
        authorizePayment,
        notificationChannel,
      });

      // Fetch the created reservation for full details
      const reservation = await this.reservationRepository.findById(
        ReservationId.create(result.reservationId),
      );

      if (!reservation) {
        throw new Error('Failed to retrieve created reservation');
      }

      const response: CreateReservationResponse = {
        reservationId: result.reservationId,
        equipmentId: reservation.equipmentId.toString(),
        memberId: reservation.memberId.toString(),
        equipmentName: result.equipmentName,
        startDate: result.startDate.toISOString(),
        endDate: result.endDate.toISOString(),
        status: reservation.status,
        paymentStatus: result.authorizationId ? 'AUTHORIZED' : 'PENDING',
        authorizationId: result.authorizationId,
        totalCost: result.totalCost,
        discountApplied: result.discountApplied,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reservations/:reservationId
   * Get reservation details by ID
   */
  private async getReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reservationId } = req.params;

      const reservation = await this.reservationRepository.findById(
        ReservationId.create(reservationId),
      );

      if (!reservation) {
        res.status(404).json({
          error: {
            code: 'RESERVATION_NOT_FOUND',
            message: `Reservation not found: ${reservationId}`,
          },
        });
        return;
      }

      const response: GetReservationResponse = {
        reservationId: reservation.id.value,
        equipmentId: reservation.equipmentId.value,
        memberId: reservation.memberId.value,
        startDate: reservation.period.start.toISOString(),
        endDate: reservation.period.end.toISOString(),
        status: reservation.status,
        createdAt: reservation.createdAt.toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/reservations/:reservationId/cancel
   * Cancel a reservation
   */
  private async cancelReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reservationId } = req.params;
      const body = req.body as CancelReservationRequest;

      // Map notification channel
      const notificationChannel: NotificationChannel | undefined = body.notificationChannel;

      // Cancel reservation
      const result = await this.reservationService.cancelReservation({
        reservationId,
        reason: body.reason,
        authorizationId: body.authorizationId,
        notificationChannel,
      });

      const response: CancelReservationResponse = {
        reservationId: result.reservationId,
        cancelledAt: result.cancelledAt.toISOString(),
        refundAmount: result.refundAmount,
        refundTransactionId: result.refundTransactionId,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/reservations/:reservationId/confirm
   * Confirm a reservation
   */
  private async confirmReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reservationId } = req.params;
      const body = req.body as ConfirmReservationRequest;

      // Map notification channel
      const notificationChannel: NotificationChannel | undefined = body.notificationChannel;

      // Confirm reservation
      const result = await this.reservationService.confirmReservation({
        reservationId,
        notificationChannel,
      });

      const response: ConfirmReservationResponse = {
        reservationId: result.reservationId,
        confirmedAt: result.confirmedAt.toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/reservations/:reservationId/fulfill
   * Fulfill a reservation (convert to rental)
   */
  private async fulfillReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reservationId } = req.params;
      const body = req.body as FulfillReservationRequest;

      // Validate required fields
      if (!body.paymentMethod || !body.paymentMethod.type) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required field: paymentMethod.type',
          },
        });
        return;
      }

      // Map payment method (currently we just use the type, token handling would be in payment adapter)
      const paymentMethod = body.paymentMethod.type as PaymentMethod;

      // Map notification channel
      const notificationChannel: NotificationChannel | undefined = body.notificationChannel;

      // Fulfill reservation
      const result = await this.reservationService.fulfillReservation({
        reservationId,
        paymentMethod,
        authorizationId: body.authorizationId,
        notificationChannel,
      });

      const response: FulfillReservationResponse = {
        reservationId: result.reservationId,
        rentalId: result.rentalId,
        totalCost: result.totalCost,
        transactionId: result.transactionId,
        paymentStatus: result.paymentStatus,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
}
