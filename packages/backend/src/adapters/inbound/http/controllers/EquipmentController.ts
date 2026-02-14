import { Request, Response, NextFunction, Router } from 'express';
import { GetAvailableEquipmentQueryHandler } from '../../../../application/queries/GetAvailableEquipmentQuery.js';
import { EquipmentRepository } from '../../../../domain/ports/EquipmentRepository.js';
import { EquipmentId } from '../../../../domain/value-objects/identifiers.js';
import { Equipment } from '../../../../domain/entities/Equipment.js';
import { Money } from '../../../../domain/value-objects/Money.js';
import { EquipmentCondition } from '../../../../domain/types/EquipmentCondition.js';
import { GetAvailableEquipmentResponse, GetEquipmentResponse } from '../dtos/EquipmentDTOs.js';
import { validateBody } from '../validation/middleware.js';
import { createEquipmentSchema, updateEquipmentSchema } from '../validation/schemas.js';

/**
 * HTTP Controller for Equipment operations
 * Handles REST API endpoints for equipment management
 */
export class EquipmentController {
  private router: Router;

  constructor(
    private readonly getAvailableEquipmentQueryHandler: GetAvailableEquipmentQueryHandler,
    private readonly equipmentRepository: EquipmentRepository,
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  /**
   * Setup all routes for equipment operations
   */
  private setupRoutes(): void {
    // GET /api/equipment - Get all available equipment
    this.router.get('/', this.getAvailableEquipment.bind(this));

    // POST /api/equipment - Create new equipment
    this.router.post('/', validateBody(createEquipmentSchema), this.createEquipment.bind(this));

    // GET /api/equipment/:equipmentId - Get equipment details
    this.router.get('/:equipmentId', this.getEquipment.bind(this));

    // PUT /api/equipment/:equipmentId - Update equipment
    this.router.put(
      '/:equipmentId',
      validateBody(updateEquipmentSchema),
      this.updateEquipment.bind(this),
    );
  }

  /**
   * Get the Express router
   */
  public getRouter(): Router {
    return this.router;
  }

  /**
   * GET /api/equipment
   * Get available equipment (optionally filtered by category)
   */
  private async getAvailableEquipment(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const category = req.query.category as string | undefined;

      const results = await this.getAvailableEquipmentQueryHandler.execute({ category });

      const response: GetAvailableEquipmentResponse[] = results.map((item) => ({
        equipmentId: item.equipmentId,
        name: item.name,
        description: item.description,
        category: item.category,
        dailyRate: item.dailyRate,
        condition: item.condition,
      }));

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/equipment
   * Create new equipment
   */
  private async createEquipment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description, category, dailyRate, condition } = req.body;

      const equipment = Equipment.create({
        name,
        description: description ?? '',
        category,
        dailyRate: Money.dollars(dailyRate),
        condition: (condition ?? 'GOOD') as EquipmentCondition,
        purchaseDate: new Date(),
      });

      await this.equipmentRepository.save(equipment);

      const response: GetEquipmentResponse = {
        equipmentId: equipment.id.value,
        name: equipment.name,
        description: equipment.description,
        category: equipment.category,
        dailyRate: equipment.dailyRate.amount,
        condition: equipment.condition,
        isAvailable: equipment.isAvailable,
        currentRentalId: equipment.currentRentalId,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/equipment/:equipmentId
   * Get equipment details by ID
   */
  private async getEquipment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const equipmentId = req.params['equipmentId'] as string;

      const equipment = await this.equipmentRepository.findById(EquipmentId.create(equipmentId));

      if (!equipment) {
        res.status(404).json({
          error: {
            code: 'EQUIPMENT_NOT_FOUND',
            message: `Equipment not found: ${equipmentId}`,
          },
        });
        return;
      }

      const response: GetEquipmentResponse = {
        equipmentId: equipment.id.value,
        name: equipment.name,
        description: equipment.description,
        category: equipment.category,
        dailyRate: equipment.dailyRate.amount,
        condition: equipment.condition,
        isAvailable: equipment.isAvailable,
        currentRentalId: equipment.currentRentalId,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/equipment/:equipmentId
   * Update equipment details
   */
  private async updateEquipment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const equipmentId = req.params['equipmentId'] as string;
      const updates = req.body;

      const equipment = await this.equipmentRepository.findById(EquipmentId.create(equipmentId));

      if (!equipment) {
        res.status(404).json({
          error: {
            code: 'EQUIPMENT_NOT_FOUND',
            message: `Equipment not found: ${equipmentId}`,
          },
        });
        return;
      }

      // Apply updates via domain methods
      if (updates.condition !== undefined) {
        equipment.updateCondition(updates.condition as EquipmentCondition);
      }
      if (updates.dailyRate !== undefined) {
        equipment.updateDailyRate(Money.dollars(updates.dailyRate));
      }

      // For name, description, category we need to reconstitute with new values
      const snapshot = equipment.toSnapshot();
      const updated = Equipment.reconstitute({
        ...snapshot,
        name: updates.name ?? snapshot.name,
        description: updates.description ?? snapshot.description,
        category: updates.category ?? snapshot.category,
      });

      await this.equipmentRepository.save(updated);

      const response: GetEquipmentResponse = {
        equipmentId: updated.id.value,
        name: updated.name,
        description: updated.description,
        category: updated.category,
        dailyRate: updated.dailyRate.amount,
        condition: updated.condition,
        isAvailable: updated.isAvailable,
        currentRentalId: updated.currentRentalId,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
