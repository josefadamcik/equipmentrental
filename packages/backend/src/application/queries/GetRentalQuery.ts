import { RentalRepository } from '../../domain/ports/RentalRepository.js';
import { RentalId } from '../../domain/value-objects/identifiers.js';

/**
 * Query to get a specific rental by ID
 */
export interface GetRentalQuery {
  rentalId: string;
}

/**
 * Result of rental query
 */
export interface RentalResult {
  rentalId: string;
  equipmentId: string;
  memberId: string;
  startDate: Date;
  endDate: Date;
  status: string;
  totalCost: number;
  conditionAtStart: string;
  conditionAtReturn?: string;
  actualReturnDate?: Date;
  lateFee?: number;
}

/**
 * Handler for querying a specific rental
 * Fetches rental details by rental ID
 */
export class GetRentalQueryHandler {
  constructor(private readonly rentalRepository: RentalRepository) {}

  async execute(query: GetRentalQuery): Promise<RentalResult | undefined> {
    const rentalId = RentalId.create(query.rentalId);
    const rental = await this.rentalRepository.findById(rentalId);

    if (!rental) {
      return undefined;
    }

    // Map domain entity to result DTO
    return {
      rentalId: rental.id.value,
      equipmentId: rental.equipmentId.value,
      memberId: rental.memberId.value,
      startDate: rental.period.start,
      endDate: rental.period.end,
      status: rental.status,
      totalCost: rental.totalCost.amount,
      conditionAtStart: rental.conditionAtStart,
      conditionAtReturn: rental.conditionAtReturn,
      actualReturnDate: rental.returnedAt,
      lateFee: rental.lateFee.amount,
    };
  }
}
