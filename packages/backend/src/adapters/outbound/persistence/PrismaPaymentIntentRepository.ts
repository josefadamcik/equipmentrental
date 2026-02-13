import { PrismaClient } from '@prisma/client';
import {
  PaymentIntentRecord,
  PaymentIntentRepository,
} from '../../../domain/ports/PaymentIntentRepository.js';

/**
 * Prisma implementation of PaymentIntentRepository.
 * Persists payment intent records in the database via Prisma ORM.
 */
export class PrismaPaymentIntentRepository implements PaymentIntentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(record: PaymentIntentRecord): Promise<void> {
    const data = {
      id: record.id,
      rentalId: record.rentalId,
      amount: record.amount,
      currency: record.currency,
      status: record.status,
      metadata: JSON.stringify(record.metadata),
    };

    await this.prisma.paymentIntent.upsert({
      where: { id: record.id },
      create: data,
      update: {
        rentalId: data.rentalId,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        metadata: data.metadata,
      },
    });
  }

  async findById(id: string): Promise<PaymentIntentRecord | null> {
    const row = await this.prisma.paymentIntent.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByRentalId(rentalId: string): Promise<PaymentIntentRecord[]> {
    const rows = await this.prisma.paymentIntent.findMany({ where: { rentalId } });
    return rows.map((r) => this.toDomain(r));
  }

  private toDomain(row: {
    id: string;
    rentalId: string;
    amount: number;
    currency: string;
    status: string;
    metadata: string;
    createdAt: Date;
    updatedAt: Date;
  }): PaymentIntentRecord {
    let metadata: Record<string, string> = {};
    try {
      metadata = JSON.parse(row.metadata) as Record<string, string>;
    } catch {
      // Fallback to empty object if JSON is malformed
    }
    return {
      id: row.id,
      rentalId: row.rentalId,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      metadata,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
