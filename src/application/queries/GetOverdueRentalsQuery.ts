import { RentalRepository } from '../../domain/ports/RentalRepository.js';

/**
 * Query to get all overdue rentals
 */
export interface GetOverdueRentalsQuery {
  /**
   * Optional reference date (defaults to now)
   */
  asOfDate?: Date;
}

/**
 * Result of overdue rentals query
 */
export interface OverdueRentalResult {
  rentalId: string;
  equipmentId: string;
  memberId: string;
  startDate: Date;
  endDate: Date;
  daysOverdue: number;
  totalCost: number;
  lateFee: number;
}

/**
 * Handler for querying overdue rentals
 * Fetches all rentals that have passed their end date and are still active
 */
export class GetOverdueRentalsQueryHandler {
  constructor(private readonly rentalRepository: RentalRepository) {}

  async execute(query: GetOverdueRentalsQuery): Promise<OverdueRentalResult[]> {
    const now = query.asOfDate || new Date();
    const overdueRentals = await this.rentalRepository.findOverdue(now);

    // Map domain entities to result DTOs
    return overdueRentals.map((rental) => {
      const daysOverdue = Math.abs(rental.period.getDaysUntilEnd(now));
      const lateFee = rental.lateFee.amount;

      return {
        rentalId: rental.id.value,
        equipmentId: rental.equipmentId.value,
        memberId: rental.memberId.value,
        startDate: rental.period.start,
        endDate: rental.period.end,
        daysOverdue,
        totalCost: rental.totalCost.amount,
        lateFee,
      };
    });
  }
}
