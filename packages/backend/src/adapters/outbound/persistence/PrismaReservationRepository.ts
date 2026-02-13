import { PrismaClient, Reservation as PrismaReservation } from '@prisma/client';
import { Reservation, ReservationStatus } from '../../../domain/entities/Reservation.js';
import { ReservationRepository } from '../../../domain/ports/ReservationRepository.js';
import { ReservationId, MemberId, EquipmentId } from '../../../domain/value-objects/identifiers.js';
import { DateRange } from '../../../domain/value-objects/DateRange.js';

/**
 * Prisma implementation of ReservationRepository
 * Handles persistence of Reservation entities using Prisma ORM
 */
export class PrismaReservationRepository implements ReservationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Convert Prisma Reservation to Domain Reservation entity
   */
  private toDomain(prismaReservation: PrismaReservation): Reservation {
    return Reservation.reconstitute({
      id: ReservationId.create(prismaReservation.id),
      equipmentId: EquipmentId.create(prismaReservation.equipmentId),
      memberId: MemberId.create(prismaReservation.memberId),
      period: DateRange.create(prismaReservation.startDate, prismaReservation.endDate),
      status: prismaReservation.status as ReservationStatus,
      createdAt: prismaReservation.createdAt,
      confirmedAt: prismaReservation.confirmedAt ?? undefined,
      cancelledAt: prismaReservation.cancelledAt ?? undefined,
      fulfilledAt: prismaReservation.fulfilledAt ?? undefined,
    });
  }

  /**
   * Convert Domain Reservation to Prisma Reservation data
   */
  private toPrisma(
    reservation: Reservation,
  ): Omit<PrismaReservation, 'createdAt' | 'updatedAt' | 'expiryDate'> {
    return {
      id: reservation.id.value,
      equipmentId: reservation.equipmentId.value,
      memberId: reservation.memberId.value,
      startDate: reservation.period.start,
      endDate: reservation.period.end,
      status: reservation.status,
      confirmedAt: reservation.confirmedAt ?? null,
      cancelledAt: reservation.cancelledAt ?? null,
      fulfilledAt: reservation.fulfilledAt ?? null,
    };
  }

  async save(reservation: Reservation): Promise<void> {
    const data = this.toPrisma(reservation);
    await this.prisma.reservation.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async findById(id: ReservationId): Promise<Reservation | undefined> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: id.value },
    });
    return reservation ? this.toDomain(reservation) : undefined;
  }

  async findAll(): Promise<Reservation[]> {
    const reservations = await this.prisma.reservation.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return reservations.map((r) => this.toDomain(r));
  }

  async findByMemberId(memberId: MemberId): Promise<Reservation[]> {
    const reservations = await this.prisma.reservation.findMany({
      where: { memberId: memberId.value },
      orderBy: { startDate: 'asc' },
    });
    return reservations.map((r) => this.toDomain(r));
  }

  async findByEquipmentId(equipmentId: EquipmentId): Promise<Reservation[]> {
    const reservations = await this.prisma.reservation.findMany({
      where: { equipmentId: equipmentId.value },
      orderBy: { startDate: 'asc' },
    });
    return reservations.map((r) => this.toDomain(r));
  }

  async findByStatus(status: ReservationStatus): Promise<Reservation[]> {
    const reservations = await this.prisma.reservation.findMany({
      where: { status },
      orderBy: { startDate: 'asc' },
    });
    return reservations.map((r) => this.toDomain(r));
  }

  async findActive(): Promise<Reservation[]> {
    const reservations = await this.prisma.reservation.findMany({
      where: {
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
        },
      },
      orderBy: { startDate: 'asc' },
    });
    return reservations.map((r) => this.toDomain(r));
  }

  async findActiveByMemberId(memberId: MemberId): Promise<Reservation[]> {
    const reservations = await this.prisma.reservation.findMany({
      where: {
        memberId: memberId.value,
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
        },
      },
      orderBy: { startDate: 'asc' },
    });
    return reservations.map((r) => this.toDomain(r));
  }

  async findActiveByEquipmentId(equipmentId: EquipmentId): Promise<Reservation[]> {
    const reservations = await this.prisma.reservation.findMany({
      where: {
        equipmentId: equipmentId.value,
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
        },
      },
      orderBy: { startDate: 'asc' },
    });
    return reservations.map((r) => this.toDomain(r));
  }

  async findConflicting(equipmentId: EquipmentId, period: DateRange): Promise<Reservation[]> {
    // Find active reservations for this equipment that overlap with the period
    const reservations = await this.prisma.reservation.findMany({
      where: {
        equipmentId: equipmentId.value,
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
        },
        AND: [{ startDate: { lte: period.end } }, { endDate: { gte: period.start } }],
      },
      orderBy: { startDate: 'asc' },
    });
    return reservations.map((r) => this.toDomain(r));
  }

  async findReadyToFulfill(now: Date = new Date()): Promise<Reservation[]> {
    const reservations = await this.prisma.reservation.findMany({
      where: {
        status: ReservationStatus.CONFIRMED,
        startDate: { lte: now },
      },
      orderBy: { startDate: 'asc' },
    });
    return reservations.map((r) => this.toDomain(r));
  }

  async findExpired(now: Date = new Date()): Promise<Reservation[]> {
    // Find active reservations where the period has ended without being fulfilled
    const reservations = await this.prisma.reservation.findMany({
      where: {
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
        },
        endDate: { lt: now },
      },
      orderBy: { endDate: 'asc' },
    });
    return reservations.map((r) => this.toDomain(r));
  }

  async findStartingInPeriod(period: DateRange): Promise<Reservation[]> {
    const reservations = await this.prisma.reservation.findMany({
      where: {
        startDate: {
          gte: period.start,
          lte: period.end,
        },
      },
      orderBy: { startDate: 'asc' },
    });
    return reservations.map((r) => this.toDomain(r));
  }

  async findByCreatedDateRange(startDate: Date, endDate: Date): Promise<Reservation[]> {
    const reservations = await this.prisma.reservation.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reservations.map((r) => this.toDomain(r));
  }

  async delete(id: ReservationId): Promise<void> {
    await this.prisma.reservation.delete({
      where: { id: id.value },
    });
  }

  async exists(id: ReservationId): Promise<boolean> {
    const count = await this.prisma.reservation.count({
      where: { id: id.value },
    });
    return count > 0;
  }

  async count(): Promise<number> {
    return await this.prisma.reservation.count();
  }

  async countByStatus(status: ReservationStatus): Promise<number> {
    return await this.prisma.reservation.count({
      where: { status },
    });
  }

  async countActiveByMemberId(memberId: MemberId): Promise<number> {
    return await this.prisma.reservation.count({
      where: {
        memberId: memberId.value,
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
        },
      },
    });
  }
}
