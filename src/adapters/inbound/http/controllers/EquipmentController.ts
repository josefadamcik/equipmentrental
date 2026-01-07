import { Request, Response, NextFunction, Router } from 'express';
import { GetAvailableEquipmentQueryHandler } from '../../../../application/queries/GetAvailableEquipmentQuery.js';
import { EquipmentRepository } from '../../../../domain/ports/EquipmentRepository.js';
import { EquipmentId } from '../../../../domain/value-objects/identifiers.js';
import { GetAvailableEquipmentResponse, GetEquipmentResponse } from '../dtos/EquipmentDTOs.js';

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

    // GET /api/equipment/:equipmentId - Get equipment details
    this.router.get('/:equipmentId', this.getEquipment.bind(this));
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
   * GET /api/equipment/:equipmentId
   * Get equipment details by ID
   */
  private async getEquipment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { equipmentId } = req.params;

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
}
