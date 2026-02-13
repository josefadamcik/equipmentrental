import {
  PaymentIntentRecord,
  PaymentIntentRepository,
} from '../../../domain/ports/PaymentIntentRepository.js';

/**
 * In-memory implementation of PaymentIntentRepository.
 * Intended for use in tests and development environments.
 */
export class InMemoryPaymentIntentRepository implements PaymentIntentRepository {
  private records: Map<string, PaymentIntentRecord> = new Map();

  async save(record: PaymentIntentRecord): Promise<void> {
    this.records.set(record.id, { ...record });
  }

  async findById(id: string): Promise<PaymentIntentRecord | null> {
    const record = this.records.get(id);
    return record ? { ...record } : null;
  }

  async findByRentalId(rentalId: string): Promise<PaymentIntentRecord[]> {
    return Array.from(this.records.values())
      .filter((r) => r.rentalId === rentalId)
      .map((r) => ({ ...r }));
  }

  /**
   * Remove all records — useful for resetting state between tests.
   */
  clear(): void {
    this.records.clear();
  }
}
