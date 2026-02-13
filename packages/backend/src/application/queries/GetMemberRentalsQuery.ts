import { RentalRepository } from '../../domain/ports/RentalRepository.js';
import { MemberId } from '../../domain/value-objects/identifiers.js';
import { Rental } from '../../domain/entities/Rental.js';

/**
 * Query to get all rentals for a specific member
 */
export interface GetMemberRentalsQuery {
  memberId: string;
  /**
   * Optional filter - if true, only return active rentals
   */
  activeOnly?: boolean;
}

/**
 * Result of member rentals query
 */
export interface MemberRentalResult {
  rentalId: string;
  equipmentId: string;
  startDate: Date;
  endDate: Date;
  status: string;
  totalCost: number;
  actualReturnDate?: Date;
  lateFee?: number;
  isOverdue: boolean;
}

/**
 * Handler for querying rentals by member
 * Fetches all rentals (or active rentals) for a specific member
 */
export class GetMemberRentalsQueryHandler {
  constructor(private readonly rentalRepository: RentalRepository) {}

  async execute(query: GetMemberRentalsQuery): Promise<MemberRentalResult[]> {
    const memberId = MemberId.create(query.memberId);
    let rentals: Rental[];

    if (query.activeOnly) {
      // Get only active rentals for the member
      rentals = await this.rentalRepository.findActiveByMemberId(memberId);
    } else {
      // Get all rentals for the member
      rentals = await this.rentalRepository.findByMemberId(memberId);
    }

    const now = new Date();

    // Map domain entities to result DTOs
    return rentals.map((rental) => ({
      rentalId: rental.id.value,
      equipmentId: rental.equipmentId.value,
      startDate: rental.period.start,
      endDate: rental.period.end,
      status: rental.status,
      totalCost: rental.totalCost.amount,
      actualReturnDate: rental.returnedAt,
      lateFee: rental.lateFee.amount,
      isOverdue: rental.isOverdue(now),
    }));
  }
}
