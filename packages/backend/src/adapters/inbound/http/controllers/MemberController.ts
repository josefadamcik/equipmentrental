import { Request, Response, NextFunction, Router } from 'express';
import { GetMemberRentalsQueryHandler } from '../../../../application/queries/GetMemberRentalsQuery.js';
import { MemberRepository } from '../../../../domain/ports/MemberRepository.js';
import { EquipmentRepository } from '../../../../domain/ports/EquipmentRepository.js';
import { MemberId, EquipmentId } from '../../../../domain/value-objects/identifiers.js';
import { GetMemberResponse, GetMemberRentalsResponse } from '../dtos/MemberDTOs.js';

/**
 * HTTP Controller for Member operations
 * Handles REST API endpoints for member management
 */
export class MemberController {
  private router: Router;

  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly equipmentRepository: EquipmentRepository,
    private readonly getMemberRentalsQueryHandler: GetMemberRentalsQueryHandler,
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  /**
   * Setup all routes for member operations
   */
  private setupRoutes(): void {
    // GET /api/members/:memberId - Get member details
    this.router.get('/:memberId', this.getMember.bind(this));

    // GET /api/members/:memberId/rentals - Get member's rentals
    this.router.get('/:memberId/rentals', this.getMemberRentals.bind(this));
  }

  /**
   * Get the Express router
   */
  public getRouter(): Router {
    return this.router;
  }

  /**
   * GET /api/members/:memberId
   * Get member details by ID
   */
  private async getMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.params['memberId'] as string;

      const member = await this.memberRepository.findById(MemberId.create(memberId));

      if (!member) {
        res.status(404).json({
          error: {
            code: 'MEMBER_NOT_FOUND',
            message: `Member not found: ${memberId}`,
          },
        });
        return;
      }

      const response: GetMemberResponse = {
        memberId: member.id.value,
        name: member.name,
        email: member.email,
        tier: member.tier,
        joinDate: member.joinDate.toISOString(),
        isActive: member.isActive,
        activeRentalCount: member.activeRentalCount,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/members/:memberId/rentals
   * Get all rentals for a specific member
   */
  private async getMemberRentals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.params['memberId'] as string;

      const results = await this.getMemberRentalsQueryHandler.execute({ memberId });

      // Enrich with equipment names
      const enrichedResults = await Promise.all(
        results.map(async (rental) => {
          const equipmentId = EquipmentId.create(rental.equipmentId);
          const equipment = await this.equipmentRepository.findById(equipmentId);

          const response: GetMemberRentalsResponse = {
            rentalId: rental.rentalId,
            equipmentId: rental.equipmentId,
            equipmentName: equipment?.name || 'Unknown',
            startDate: rental.startDate.toISOString(),
            endDate: rental.endDate.toISOString(),
            status: rental.status,
            totalCost: rental.totalCost,
          };

          return response;
        }),
      );

      res.status(200).json(enrichedResults);
    } catch (error) {
      next(error);
    }
  }
}
