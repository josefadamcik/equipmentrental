import { Request, Response, NextFunction, Router } from 'express';
import { RentalService } from '../../../../application/services/RentalService.js';
import { GetRentalQueryHandler } from '../../../../application/queries/GetRentalQuery.js';
import { GetMemberRentalsQueryHandler } from '../../../../application/queries/GetMemberRentalsQuery.js';
import { GetOverdueRentalsQueryHandler } from '../../../../application/queries/GetOverdueRentalsQuery.js';
import { PaymentMethod } from '../../../../domain/ports/PaymentService.js';
import { NotificationChannel } from '../../../../domain/ports/NotificationService.js';
import {
  CreateRentalResponse,
  ReturnRentalResponse,
  ExtendRentalResponse,
  GetRentalResponse,
} from '../dtos/RentalDTOs.js';
import { validateBody } from '../validation/middleware.js';
import {
  createRentalSchema,
  returnRentalSchema,
  extendRentalSchema,
} from '../validation/schemas.js';

/**
 * HTTP Controller for Rental operations
 * Handles REST API endpoints for rental management
 */
export class RentalController {
  private router: Router;

  constructor(
    private readonly rentalService: RentalService,
    private readonly getRentalQueryHandler: GetRentalQueryHandler,
    private readonly getMemberRentalsQueryHandler: GetMemberRentalsQueryHandler,
    private readonly getOverdueRentalsQueryHandler: GetOverdueRentalsQueryHandler,
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  /**
   * Setup all routes for rental operations
   */
  private setupRoutes(): void {
    // POST /api/rentals - Create a new rental
    this.router.post('/', validateBody(createRentalSchema), this.createRental.bind(this));

    // GET /api/rentals/:rentalId - Get rental details
    this.router.get('/:rentalId', this.getRental.bind(this));

    // PUT /api/rentals/:rentalId/return - Return a rental
    this.router.put(
      '/:rentalId/return',
      validateBody(returnRentalSchema),
      this.returnRental.bind(this),
    );

    // PUT /api/rentals/:rentalId/extend - Extend a rental
    this.router.put(
      '/:rentalId/extend',
      validateBody(extendRentalSchema),
      this.extendRental.bind(this),
    );

    // GET /api/rentals/overdue - Get overdue rentals
    this.router.get('/status/overdue', this.getOverdueRentals.bind(this));

    // GET /api/rentals/member/:memberId - Get member's rentals
    this.router.get('/member/:memberId', this.getMemberRentals.bind(this));
  }

  /**
   * Get the Express router
   */
  public getRouter(): Router {
    return this.router;
  }

  /**
   * POST /api/rentals
   * Create a new rental
   */
  private async createRental(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // req.body has already been validated and parsed by validateBody(createRentalSchema)
      const body = req.body as import('../validation/schemas.js').CreateRentalInput;

      const startDate = new Date(body.startDate);
      const endDate = new Date(body.endDate);

      // Map payment method
      const paymentMethod = body.paymentMethod.type as PaymentMethod;

      // Map notification channel
      const notificationChannel: NotificationChannel | undefined = body.notificationChannel;

      // Create rental
      const result = await this.rentalService.createRentalWithPayment({
        equipmentId: body.equipmentId,
        memberId: body.memberId,
        startDate,
        endDate,
        paymentMethod,
        notificationChannel,
      });

      const response: CreateRentalResponse = {
        rentalId: result.rentalId,
        totalCost: result.totalCost,
        discountApplied: result.discountApplied,
        transactionId: result.transactionId,
        paymentStatus: result.paymentStatus,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/rentals/:rentalId
   * Get rental details by ID
   */
  private async getRental(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rentalId } = req.params;

      const result = await this.getRentalQueryHandler.execute({ rentalId });

      if (!result) {
        res.status(404).json({
          error: {
            code: 'RENTAL_NOT_FOUND',
            message: `Rental not found: ${rentalId}`,
          },
        });
        return;
      }

      const response: GetRentalResponse = {
        rentalId: result.rentalId,
        equipmentId: result.equipmentId,
        memberId: result.memberId,
        startDate: result.startDate.toISOString(),
        endDate: result.endDate.toISOString(),
        status: result.status,
        totalCost: result.totalCost,
        conditionAtStart: result.conditionAtStart,
        conditionAtReturn: result.conditionAtReturn,
        actualReturnDate: result.actualReturnDate?.toISOString(),
        lateFee: result.lateFee,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/rentals/:rentalId/return
   * Return a rental
   */
  private async returnRental(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rentalId } = req.params;
      // req.body has already been validated by validateBody(returnRentalSchema)
      const body = req.body as import('../validation/schemas.js').ReturnRentalInput;

      // Parse return date if provided
      let returnDate: Date | undefined;
      if (body.returnDate) {
        returnDate = new Date(body.returnDate);
      }

      // Map payment method if provided
      let paymentMethod: PaymentMethod | undefined;
      if (body.paymentMethod) {
        paymentMethod = body.paymentMethod.type as PaymentMethod;
      }

      // Map notification channel
      const notificationChannel: NotificationChannel | undefined = body.notificationChannel;

      // Return rental (cast condition to EquipmentCondition type)
      const result = await this.rentalService.returnRentalWithPayment({
        rentalId,
        conditionAtReturn:
          body.conditionAtReturn as import('../../../../domain/types/EquipmentCondition.js').EquipmentCondition,
        returnDate,
        paymentMethod,
        notificationChannel,
      });

      const response: ReturnRentalResponse = {
        rentalId: result.rentalId,
        totalCost: result.totalCost,
        lateFee: result.lateFee,
        damageFee: result.damageFee,
        transactionId: result.transactionId,
        paymentStatus: result.paymentStatus,
        refundTransactionId: result.refundTransactionId,
        refundAmount: result.refundAmount,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/rentals/:rentalId/extend
   * Extend a rental period
   */
  private async extendRental(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rentalId } = req.params;
      // req.body has already been validated by validateBody(extendRentalSchema)
      const body = req.body as import('../validation/schemas.js').ExtendRentalInput;

      // Map payment method
      const paymentMethod = body.paymentMethod.type as PaymentMethod;

      // Map notification channel
      const notificationChannel: NotificationChannel | undefined = body.notificationChannel;

      // Extend rental
      const result = await this.rentalService.extendRental({
        rentalId,
        additionalDays: body.additionalDays,
        paymentMethod,
        notificationChannel,
      });

      const response: ExtendRentalResponse = {
        rentalId: result.rentalId,
        newEndDate: result.newEndDate.toISOString(),
        additionalCost: result.additionalCost,
        transactionId: result.transactionId,
        paymentStatus: result.paymentStatus,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/rentals/status/overdue
   * Get all overdue rentals
   */
  private async getOverdueRentals(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const results = await this.getOverdueRentalsQueryHandler.execute({});

      res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/rentals/member/:memberId
   * Get all rentals for a specific member
   */
  private async getMemberRentals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { memberId } = req.params;

      const results = await this.getMemberRentalsQueryHandler.execute({ memberId });

      res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  }
}
