/**
 * Represents a persisted payment intent record
 */
export interface PaymentIntentRecord {
  id: string;
  rentalId: string;
  amount: number;
  currency: string;
  status: string;
  metadata: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Port for persisting and retrieving payment intent records.
 * Implementations may use in-memory storage (for testing) or a database (for production).
 */
export interface PaymentIntentRepository {
  /**
   * Persist a payment intent record (insert or update by id)
   */
  save(record: PaymentIntentRecord): Promise<void>;

  /**
   * Find a payment intent record by its Stripe payment intent id
   */
  findById(id: string): Promise<PaymentIntentRecord | null>;

  /**
   * Find all payment intent records associated with a rental
   */
  findByRentalId(rentalId: string): Promise<PaymentIntentRecord[]>;
}
