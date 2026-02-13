import { PrismaClient, Rental as PrismaRental } from '@prisma/client';
import { Rental } from '../../../domain/entities/Rental.js';
import { RentalRepository } from '../../../domain/ports/RentalRepository.js';
import { RentalId, MemberId, EquipmentId } from '../../../domain/value-objects/identifiers.js';
import { Money } from '../../../domain/value-objects/Money.js';
import { DateRange } from '../../../domain/value-objects/DateRange.js';
import { RentalStatus } from '../../../domain/types/RentalStatus.js';
import { EquipmentCondition } from '../../../domain/types/EquipmentCondition.js';

/**
 * Prisma implementation of RentalRepository
 * Handles persistence of Rental entities using Prisma ORM
 */
export class PrismaRentalRepository implements RentalRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Convert Prisma Rental to Domain Rental entity
   */
  private toDomain(prismaRental: PrismaRental): Rental {
    return Rental.reconstitute({
      id: RentalId.create(prismaRental.id),
      equipmentId: EquipmentId.create(prismaRental.equipmentId),
      memberId: MemberId.create(prismaRental.memberId),
      period: DateRange.create(prismaRental.startDate, prismaRental.endDate),
      status: prismaRental.status as RentalStatus,
      baseCost: Money.dollars(prismaRental.baseCostAmount),
      totalCost: Money.dollars(prismaRental.totalCostAmount),
      lateFee: Money.dollars(prismaRental.lateFeeAmount),
      createdAt: prismaRental.createdAt,
      returnedAt: prismaRental.returnedAt ?? undefined,
      conditionAtStart: prismaRental.conditionAtStart as EquipmentCondition,
      conditionAtReturn: prismaRental.conditionAtReturn
        ? (prismaRental.conditionAtReturn as EquipmentCondition)
        : undefined,
    });
  }

  /**
   * Convert Domain Rental to Prisma Rental data
   */
  private toPrisma(rental: Rental): Omit<PrismaRental, 'createdAt' | 'updatedAt'> {
    return {
      id: rental.id.value,
      equipmentId: rental.equipmentId.value,
      memberId: rental.memberId.value,
      startDate: rental.period.start,
      endDate: rental.period.end,
      status: rental.status,
      baseCostAmount: rental.baseCost.amount,
      baseCostCurrency: 'USD',
      totalCostAmount: rental.totalCost.amount,
      totalCostCurrency: 'USD',
      lateFeeAmount: rental.lateFee.amount,
      lateFeeCurrency: 'USD',
      conditionAtStart: rental.conditionAtStart,
      conditionAtReturn: rental.conditionAtReturn ?? null,
      returnedAt: rental.returnedAt ?? null,
    };
  }

  async save(rental: Rental): Promise<void> {
    const data = this.toPrisma(rental);
    await this.prisma.rental.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async findById(id: RentalId): Promise<Rental | undefined> {
    const rental = await this.prisma.rental.findUnique({
      where: { id: id.value },
    });
    return rental ? this.toDomain(rental) : undefined;
  }

  async findAll(): Promise<Rental[]> {
    const rentals = await this.prisma.rental.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rentals.map((r) => this.toDomain(r));
  }

  async findByMemberId(memberId: MemberId): Promise<Rental[]> {
    const rentals = await this.prisma.rental.findMany({
      where: { memberId: memberId.value },
      orderBy: { createdAt: 'desc' },
    });
    return rentals.map((r) => this.toDomain(r));
  }

  async findByEquipmentId(equipmentId: EquipmentId): Promise<Rental[]> {
    const rentals = await this.prisma.rental.findMany({
      where: { equipmentId: equipmentId.value },
      orderBy: { createdAt: 'desc' },
    });
    return rentals.map((r) => this.toDomain(r));
  }

  async findByStatus(status: RentalStatus): Promise<Rental[]> {
    const rentals = await this.prisma.rental.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
    return rentals.map((r) => this.toDomain(r));
  }

  async findActive(): Promise<Rental[]> {
    const rentals = await this.prisma.rental.findMany({
      where: {
        status: {
          in: [RentalStatus.ACTIVE, RentalStatus.OVERDUE],
        },
      },
      orderBy: { startDate: 'asc' },
    });
    return rentals.map((r) => this.toDomain(r));
  }

  async findActiveByMemberId(memberId: MemberId): Promise<Rental[]> {
    const rentals = await this.prisma.rental.findMany({
      where: {
        memberId: memberId.value,
        status: {
          in: [RentalStatus.ACTIVE, RentalStatus.OVERDUE],
        },
      },
      orderBy: { startDate: 'asc' },
    });
    return rentals.map((r) => this.toDomain(r));
  }

  async findActiveByEquipmentId(equipmentId: EquipmentId): Promise<Rental | undefined> {
    const rental = await this.prisma.rental.findFirst({
      where: {
        equipmentId: equipmentId.value,
        status: {
          in: [RentalStatus.ACTIVE, RentalStatus.OVERDUE],
        },
      },
    });
    return rental ? this.toDomain(rental) : undefined;
  }

  async findOverdue(now: Date = new Date()): Promise<Rental[]> {
    const rentals = await this.prisma.rental.findMany({
      where: {
        status: {
          in: [RentalStatus.ACTIVE, RentalStatus.OVERDUE],
        },
        endDate: { lt: now },
      },
      orderBy: { endDate: 'asc' },
    });
    return rentals.map((r) => this.toDomain(r));
  }

  async findEndingInPeriod(period: DateRange): Promise<Rental[]> {
    const rentals = await this.prisma.rental.findMany({
      where: {
        status: {
          in: [RentalStatus.ACTIVE, RentalStatus.OVERDUE],
        },
        endDate: {
          gte: period.start,
          lte: period.end,
        },
      },
      orderBy: { endDate: 'asc' },
    });
    return rentals.map((r) => this.toDomain(r));
  }

  async findByCreatedDateRange(startDate: Date, endDate: Date): Promise<Rental[]> {
    const rentals = await this.prisma.rental.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rentals.map((r) => this.toDomain(r));
  }

  async findByReturnedDateRange(startDate: Date, endDate: Date): Promise<Rental[]> {
    const rentals = await this.prisma.rental.findMany({
      where: {
        returnedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { returnedAt: 'desc' },
    });
    return rentals.map((r) => this.toDomain(r));
  }

  async delete(id: RentalId): Promise<void> {
    await this.prisma.rental.delete({
      where: { id: id.value },
    });
  }

  async exists(id: RentalId): Promise<boolean> {
    const count = await this.prisma.rental.count({
      where: { id: id.value },
    });
    return count > 0;
  }

  async count(): Promise<number> {
    return await this.prisma.rental.count();
  }

  async countByStatus(status: RentalStatus): Promise<number> {
    return await this.prisma.rental.count({
      where: { status },
    });
  }

  async countActiveByMemberId(memberId: MemberId): Promise<number> {
    return await this.prisma.rental.count({
      where: {
        memberId: memberId.value,
        status: {
          in: [RentalStatus.ACTIVE, RentalStatus.OVERDUE],
        },
      },
    });
  }
}
