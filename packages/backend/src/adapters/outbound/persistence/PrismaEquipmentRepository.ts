import { PrismaClient, Equipment as PrismaEquipment } from '@prisma/client';
import { Equipment } from '../../../domain/entities/Equipment.js';
import { EquipmentRepository } from '../../../domain/ports/EquipmentRepository.js';
import { EquipmentId } from '../../../domain/value-objects/identifiers.js';
import { Money } from '../../../domain/value-objects/Money.js';
import { EquipmentCondition } from '../../../domain/types/EquipmentCondition.js';
import { DateRange } from '../../../domain/value-objects/DateRange.js';

/**
 * Prisma implementation of EquipmentRepository
 * Handles persistence of Equipment entities using Prisma ORM
 */
export class PrismaEquipmentRepository implements EquipmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Convert Prisma Equipment to Domain Equipment entity
   */
  private toDomain(prismaEquipment: PrismaEquipment): Equipment {
    return Equipment.reconstitute({
      id: EquipmentId.create(prismaEquipment.id),
      name: prismaEquipment.name,
      description: prismaEquipment.description,
      category: prismaEquipment.category,
      dailyRate: Money.dollars(prismaEquipment.dailyRateAmount),
      condition: prismaEquipment.condition as EquipmentCondition,
      isAvailable: prismaEquipment.isAvailable,
      currentRentalId: prismaEquipment.currentRentalId ?? undefined,
      purchaseDate: prismaEquipment.purchaseDate,
      lastMaintenanceDate: prismaEquipment.lastMaintenanceDate ?? undefined,
    });
  }

  /**
   * Convert Domain Equipment to Prisma Equipment data
   */
  private toPrisma(equipment: Equipment): Omit<PrismaEquipment, 'createdAt' | 'updatedAt'> {
    return {
      id: equipment.id.value,
      name: equipment.name,
      description: equipment.description,
      category: equipment.category,
      dailyRateAmount: equipment.dailyRate.amount,
      dailyRateCurrency: 'USD',
      condition: equipment.condition,
      isAvailable: equipment.isAvailable,
      currentRentalId: equipment.currentRentalId ?? null,
      purchaseDate: equipment.purchaseDate,
      lastMaintenanceDate: equipment.lastMaintenanceDate ?? null,
    };
  }

  async save(equipment: Equipment): Promise<void> {
    const data = this.toPrisma(equipment);
    await this.prisma.equipment.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async findById(id: EquipmentId): Promise<Equipment | undefined> {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id: id.value },
    });
    return equipment ? this.toDomain(equipment) : undefined;
  }

  async findAll(): Promise<Equipment[]> {
    const equipmentList = await this.prisma.equipment.findMany({
      orderBy: { name: 'asc' },
    });
    return equipmentList.map((e) => this.toDomain(e));
  }

  async findByCategory(category: string): Promise<Equipment[]> {
    const equipmentList = await this.prisma.equipment.findMany({
      where: { category },
      orderBy: { name: 'asc' },
    });
    return equipmentList.map((e) => this.toDomain(e));
  }

  async findAvailable(): Promise<Equipment[]> {
    const equipmentList = await this.prisma.equipment.findMany({
      where: { isAvailable: true },
      orderBy: { name: 'asc' },
    });
    return equipmentList.map((e) => this.toDomain(e));
  }

  async findAvailableByCategory(category: string): Promise<Equipment[]> {
    const equipmentList = await this.prisma.equipment.findMany({
      where: {
        category,
        isAvailable: true,
      },
      orderBy: { name: 'asc' },
    });
    return equipmentList.map((e) => this.toDomain(e));
  }

  async findNeedingMaintenance(now: Date = new Date()): Promise<Equipment[]> {
    const equipmentList = await this.prisma.equipment.findMany();
    const domainEquipment = equipmentList.map((e) => this.toDomain(e));
    return domainEquipment.filter((e) => e.needsMaintenance(now));
  }

  async findAvailableDuringPeriod(period: DateRange): Promise<Equipment[]> {
    // Find equipment that is available and not rented during the specified period
    const equipmentList = await this.prisma.equipment.findMany({
      where: { isAvailable: true },
      include: {
        rentals: {
          where: {
            status: { in: ['ACTIVE', 'OVERDUE'] },
            OR: [
              {
                startDate: { lte: period.end },
                endDate: { gte: period.start },
              },
            ],
          },
        },
        reservations: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED'] },
            OR: [
              {
                startDate: { lte: period.end },
                endDate: { gte: period.start },
              },
            ],
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Filter out equipment with conflicting rentals or reservations
    return equipmentList
      .filter((e) => e.rentals.length === 0 && e.reservations.length === 0)
      .map((e) => this.toDomain(e));
  }

  async delete(id: EquipmentId): Promise<void> {
    await this.prisma.equipment.delete({
      where: { id: id.value },
    });
  }

  async exists(id: EquipmentId): Promise<boolean> {
    const count = await this.prisma.equipment.count({
      where: { id: id.value },
    });
    return count > 0;
  }

  async count(): Promise<number> {
    return await this.prisma.equipment.count();
  }

  async countByCategory(category: string): Promise<number> {
    return await this.prisma.equipment.count({
      where: { category },
    });
  }
}
