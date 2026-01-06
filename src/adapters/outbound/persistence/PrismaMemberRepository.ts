import { PrismaClient, Member as PrismaMember } from '@prisma/client';
import { Member } from '../../../domain/entities/Member.js';
import { MemberRepository } from '../../../domain/ports/MemberRepository.js';
import { MemberId } from '../../../domain/value-objects/identifiers.js';
import { MembershipTier } from '../../../domain/types/MembershipTier.js';
import { DateRange } from '../../../domain/value-objects/DateRange.js';

/**
 * Prisma implementation of MemberRepository
 * Handles persistence of Member entities using Prisma ORM
 */
export class PrismaMemberRepository implements MemberRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Convert Prisma Member to Domain Member entity
   */
  private toDomain(prismaMember: PrismaMember): Member {
    return Member.reconstitute({
      id: MemberId.create(prismaMember.id),
      name: prismaMember.name,
      email: prismaMember.email,
      tier: prismaMember.tier as MembershipTier,
      joinDate: prismaMember.joinDate,
      activeRentalCount: prismaMember.activeRentalCount,
      totalRentals: prismaMember.totalRentalCount,
      isActive: prismaMember.isActive,
    });
  }

  /**
   * Convert Domain Member to Prisma Member data
   */
  private toPrisma(member: Member): Omit<PrismaMember, 'createdAt' | 'updatedAt'> {
    return {
      id: member.id.value,
      name: member.name,
      email: member.email,
      tier: member.tier,
      joinDate: member.joinDate,
      activeRentalCount: member.activeRentalCount,
      totalRentalCount: member.totalRentals,
      isActive: member.isActive,
    };
  }

  async save(member: Member): Promise<void> {
    const data = this.toPrisma(member);

    // Check if email is already taken by another member
    const existing = await this.prisma.member.findUnique({
      where: { email: data.email },
    });

    if (existing && existing.id !== data.id) {
      throw new Error(`Email ${data.email} is already registered to another member`);
    }

    await this.prisma.member.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async findById(id: MemberId): Promise<Member | undefined> {
    const member = await this.prisma.member.findUnique({
      where: { id: id.value },
    });
    return member ? this.toDomain(member) : undefined;
  }

  async findByEmail(email: string): Promise<Member | undefined> {
    const member = await this.prisma.member.findUnique({
      where: { email },
    });
    return member ? this.toDomain(member) : undefined;
  }

  async findAll(): Promise<Member[]> {
    const members = await this.prisma.member.findMany({
      orderBy: { name: 'asc' },
    });
    return members.map((m) => this.toDomain(m));
  }

  async findByTier(tier: MembershipTier): Promise<Member[]> {
    const members = await this.prisma.member.findMany({
      where: { tier },
      orderBy: { name: 'asc' },
    });
    return members.map((m) => this.toDomain(m));
  }

  async findActive(): Promise<Member[]> {
    const members = await this.prisma.member.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return members.map((m) => this.toDomain(m));
  }

  async findWithActiveRentals(): Promise<Member[]> {
    const members = await this.prisma.member.findMany({
      where: {
        activeRentalCount: { gt: 0 },
      },
      orderBy: { name: 'asc' },
    });
    return members.map((m) => this.toDomain(m));
  }

  async findByJoinDateRange(range: DateRange): Promise<Member[]> {
    const members = await this.prisma.member.findMany({
      where: {
        joinDate: {
          gte: range.start,
          lte: range.end,
        },
      },
      orderBy: { joinDate: 'desc' },
    });
    return members.map((m) => this.toDomain(m));
  }

  async delete(id: MemberId): Promise<void> {
    await this.prisma.member.delete({
      where: { id: id.value },
    });
  }

  async exists(id: MemberId): Promise<boolean> {
    const count = await this.prisma.member.count({
      where: { id: id.value },
    });
    return count > 0;
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await this.prisma.member.count({
      where: { email },
    });
    return count > 0;
  }

  async count(): Promise<number> {
    return await this.prisma.member.count();
  }

  async countActive(): Promise<number> {
    return await this.prisma.member.count({
      where: { isActive: true },
    });
  }

  async countByTier(tier: MembershipTier): Promise<number> {
    return await this.prisma.member.count({
      where: { tier },
    });
  }
}
