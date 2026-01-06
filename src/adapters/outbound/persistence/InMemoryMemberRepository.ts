import { Member } from '../../../domain/entities/Member.js';
import { MemberId } from '../../../domain/value-objects/identifiers.js';
import { MembershipTier } from '../../../domain/types/MembershipTier.js';
import { MemberRepository } from '../../../domain/ports/MemberRepository.js';

/**
 * In-memory implementation of MemberRepository for testing
 * Stores members in memory using Maps for fast lookups
 * Maintains email uniqueness constraint
 */
export class InMemoryMemberRepository implements MemberRepository {
  private members: Map<string, Member> = new Map();
  private emailIndex: Map<string, string> = new Map(); // email -> memberId

  async findById(id: MemberId): Promise<Member | undefined> {
    const member = this.members.get(id.value);
    return member ? this.clone(member) : undefined;
  }

  async findByEmail(email: string): Promise<Member | undefined> {
    const memberId = this.emailIndex.get(email.toLowerCase());
    if (!memberId) {
      return undefined;
    }
    const member = this.members.get(memberId);
    return member ? this.clone(member) : undefined;
  }

  async findAll(): Promise<Member[]> {
    return Array.from(this.members.values()).map((m) => this.clone(m));
  }

  async findByTier(tier: MembershipTier): Promise<Member[]> {
    return Array.from(this.members.values())
      .filter((m) => m.tier === tier)
      .map((m) => this.clone(m));
  }

  async findActive(): Promise<Member[]> {
    return Array.from(this.members.values())
      .filter((m) => m.isActive)
      .map((m) => this.clone(m));
  }

  async findWithActiveRentals(): Promise<Member[]> {
    return Array.from(this.members.values())
      .filter((m) => m.activeRentalCount > 0)
      .map((m) => this.clone(m));
  }

  async findByJoinDateRange(startDate: Date, endDate: Date): Promise<Member[]> {
    return Array.from(this.members.values())
      .filter((m) => {
        const joinDate = m.joinDate.getTime();
        return joinDate >= startDate.getTime() && joinDate <= endDate.getTime();
      })
      .map((m) => this.clone(m));
  }

  async save(member: Member): Promise<void> {
    const existingMember = this.members.get(member.id.value);

    // Check email uniqueness
    const emailMemberId = this.emailIndex.get(member.email.toLowerCase());
    if (emailMemberId && emailMemberId !== member.id.value) {
      throw new Error(`Email ${member.email} is already registered`);
    }

    // Update email index
    if (existingMember && existingMember.email !== member.email) {
      // Remove old email from index
      this.emailIndex.delete(existingMember.email.toLowerCase());
    }
    this.emailIndex.set(member.email.toLowerCase(), member.id.value);

    // Store a clone to avoid external mutations
    this.members.set(member.id.value, this.clone(member));
  }

  async delete(id: MemberId): Promise<void> {
    const member = this.members.get(id.value);
    if (member) {
      this.emailIndex.delete(member.email.toLowerCase());
      this.members.delete(id.value);
    }
  }

  async exists(id: MemberId): Promise<boolean> {
    return this.members.has(id.value);
  }

  async emailExists(email: string): Promise<boolean> {
    return this.emailIndex.has(email.toLowerCase());
  }

  async count(): Promise<number> {
    return this.members.size;
  }

  async countActive(): Promise<number> {
    return Array.from(this.members.values()).filter((m) => m.isActive).length;
  }

  async countByTier(tier: MembershipTier): Promise<number> {
    return Array.from(this.members.values()).filter((m) => m.tier === tier).length;
  }

  /**
   * Clear all members from the repository
   * Useful for testing
   */
  clear(): void {
    this.members.clear();
    this.emailIndex.clear();
  }

  /**
   * Clone a member entity to avoid reference issues
   */
  private clone(member: Member): Member {
    return Member.reconstitute(member.toSnapshot());
  }
}
