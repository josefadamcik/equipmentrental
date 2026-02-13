import { MemberRepository } from '../MemberRepository';
import { Member } from '../../entities/Member';
import { MemberId } from '../../value-objects/identifiers';
import { MembershipTier } from '../../types/MembershipTier';

/**
 * Mock implementation of MemberRepository for testing
 */
class MockMemberRepository implements MemberRepository {
  private members: Map<string, Member> = new Map();

  async findById(id: MemberId): Promise<Member | undefined> {
    return this.members.get(id.value);
  }

  async findByEmail(email: string): Promise<Member | undefined> {
    return Array.from(this.members.values()).find((m) => m.email === email);
  }

  async findAll(): Promise<Member[]> {
    return Array.from(this.members.values());
  }

  async findByTier(tier: MembershipTier): Promise<Member[]> {
    return Array.from(this.members.values()).filter((m) => m.tier === tier);
  }

  async findActive(): Promise<Member[]> {
    return Array.from(this.members.values()).filter((m) => m.isActive);
  }

  async findWithActiveRentals(): Promise<Member[]> {
    return Array.from(this.members.values()).filter((m) => m.activeRentalCount > 0);
  }

  async findByJoinDateRange(startDate: Date, endDate: Date): Promise<Member[]> {
    return Array.from(this.members.values()).filter(
      (m) => m.joinDate >= startDate && m.joinDate <= endDate,
    );
  }

  async save(member: Member): Promise<void> {
    this.members.set(member.id.value, member);
  }

  async delete(id: MemberId): Promise<void> {
    this.members.delete(id.value);
  }

  async exists(id: MemberId): Promise<boolean> {
    return this.members.has(id.value);
  }

  async emailExists(email: string): Promise<boolean> {
    return Array.from(this.members.values()).some((m) => m.email === email);
  }

  async count(): Promise<number> {
    return this.members.size;
  }

  async countActive(): Promise<number> {
    return (await this.findActive()).length;
  }

  async countByTier(tier: MembershipTier): Promise<number> {
    return (await this.findByTier(tier)).length;
  }

  clear(): void {
    this.members.clear();
  }
}

describe('MemberRepository Port', () => {
  let repository: MockMemberRepository;
  let member: Member;

  beforeEach(() => {
    repository = new MockMemberRepository();
    member = Member.create({
      name: 'John Doe',
      email: 'john@example.com',
      tier: MembershipTier.BASIC,
      joinDate: new Date('2024-01-01'),
      isActive: true,
    });
  });

  describe('save', () => {
    it('should save member', async () => {
      await repository.save(member);
      const found = await repository.findById(member.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe('John Doe');
    });

    it('should update existing member', async () => {
      await repository.save(member);
      member.updateName('Jane Doe');
      await repository.save(member);

      const found = await repository.findById(member.id);
      expect(found?.name).toBe('Jane Doe');
    });
  });

  describe('findById', () => {
    it('should find member by id', async () => {
      await repository.save(member);
      const found = await repository.findById(member.id);
      expect(found).toBeDefined();
      expect(found?.id.equals(member.id)).toBe(true);
    });

    it('should return undefined for non-existent id', async () => {
      const nonExistentId = MemberId.generate();
      const found = await repository.findById(nonExistentId);
      expect(found).toBeUndefined();
    });
  });

  describe('findByEmail', () => {
    it('should find member by email', async () => {
      await repository.save(member);
      const found = await repository.findByEmail('john@example.com');
      expect(found).toBeDefined();
      expect(found?.email).toBe('john@example.com');
    });

    it('should return undefined for non-existent email', async () => {
      const found = await repository.findByEmail('nonexistent@example.com');
      expect(found).toBeUndefined();
    });

    it('should be case-sensitive', async () => {
      await repository.save(member);
      const found = await repository.findByEmail('JOHN@EXAMPLE.COM');
      expect(found).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should return empty array when no members exist', async () => {
      const all = await repository.findAll();
      expect(all).toEqual([]);
    });

    it('should return all members', async () => {
      const member2 = Member.create({
        name: 'Jane Smith',
        email: 'jane@example.com',
        tier: MembershipTier.PLATINUM,
        joinDate: new Date('2024-02-01'),
        isActive: true,
      });

      await repository.save(member);
      await repository.save(member2);

      const all = await repository.findAll();
      expect(all).toHaveLength(2);
    });
  });

  describe('findByTier', () => {
    it('should find members by tier', async () => {
      const platinumMember = Member.create({
        name: 'Platinum User',
        email: 'platinum@example.com',
        tier: MembershipTier.PLATINUM,
        joinDate: new Date('2024-01-01'),
        isActive: true,
      });

      await repository.save(member);
      await repository.save(platinumMember);

      const basicMembers = await repository.findByTier(MembershipTier.BASIC);
      expect(basicMembers).toHaveLength(1);
      expect(basicMembers[0].name).toBe('John Doe');

      const platinumMembers = await repository.findByTier(MembershipTier.PLATINUM);
      expect(platinumMembers).toHaveLength(1);
      expect(platinumMembers[0].name).toBe('Platinum User');
    });
  });

  describe('findActive', () => {
    it('should find only active members', async () => {
      const inactiveMember = Member.create({
        name: 'Inactive User',
        email: 'inactive@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date('2024-01-01'),
        isActive: false,
      });

      await repository.save(member);
      await repository.save(inactiveMember);

      const activeMembers = await repository.findActive();
      expect(activeMembers).toHaveLength(1);
      expect(activeMembers[0].isActive).toBe(true);
    });
  });

  describe('findWithActiveRentals', () => {
    it('should find members with active rentals', async () => {
      await repository.save(member);

      let withRentals = await repository.findWithActiveRentals();
      expect(withRentals).toHaveLength(0);

      member.incrementActiveRentals();
      await repository.save(member);

      withRentals = await repository.findWithActiveRentals();
      expect(withRentals).toHaveLength(1);
      expect(withRentals[0].activeRentalCount).toBeGreaterThan(0);
    });
  });

  describe('findByJoinDateRange', () => {
    it('should find members by join date range', async () => {
      const member2 = Member.create({
        name: 'New Member',
        email: 'new@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date('2024-06-01'),
        isActive: true,
      });

      await repository.save(member);
      await repository.save(member2);

      const janMembers = await repository.findByJoinDateRange(
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );
      expect(janMembers).toHaveLength(1);
      expect(janMembers[0].name).toBe('John Doe');

      const allMembers = await repository.findByJoinDateRange(
        new Date('2024-01-01'),
        new Date('2024-12-31'),
      );
      expect(allMembers).toHaveLength(2);
    });
  });

  describe('delete', () => {
    it('should delete member', async () => {
      await repository.save(member);
      expect(await repository.exists(member.id)).toBe(true);

      await repository.delete(member.id);
      expect(await repository.exists(member.id)).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true for existing member', async () => {
      await repository.save(member);
      expect(await repository.exists(member.id)).toBe(true);
    });

    it('should return false for non-existent member', async () => {
      const nonExistentId = MemberId.generate();
      expect(await repository.exists(nonExistentId)).toBe(false);
    });
  });

  describe('emailExists', () => {
    it('should return true for existing email', async () => {
      await repository.save(member);
      expect(await repository.emailExists('john@example.com')).toBe(true);
    });

    it('should return false for non-existent email', async () => {
      expect(await repository.emailExists('nonexistent@example.com')).toBe(false);
    });
  });

  describe('count', () => {
    it('should count all members', async () => {
      expect(await repository.count()).toBe(0);

      await repository.save(member);
      expect(await repository.count()).toBe(1);

      const member2 = Member.create({
        name: 'Jane Smith',
        email: 'jane@example.com',
        tier: MembershipTier.PLATINUM,
        joinDate: new Date('2024-02-01'),
        isActive: true,
      });
      await repository.save(member2);
      expect(await repository.count()).toBe(2);
    });
  });

  describe('countActive', () => {
    it('should count active members', async () => {
      const inactiveMember = Member.create({
        name: 'Inactive User',
        email: 'inactive@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date('2024-01-01'),
        isActive: false,
      });

      await repository.save(member);
      await repository.save(inactiveMember);

      expect(await repository.countActive()).toBe(1);
    });
  });

  describe('countByTier', () => {
    it('should count members by tier', async () => {
      const platinumMember = Member.create({
        name: 'Platinum User',
        email: 'platinum@example.com',
        tier: MembershipTier.PLATINUM,
        joinDate: new Date('2024-01-01'),
        isActive: true,
      });

      await repository.save(member);
      await repository.save(platinumMember);

      expect(await repository.countByTier(MembershipTier.BASIC)).toBe(1);
      expect(await repository.countByTier(MembershipTier.PLATINUM)).toBe(1);
      expect(await repository.countByTier(MembershipTier.GOLD)).toBe(0);
    });
  });

  describe('type compliance', () => {
    it('should implement all required methods', () => {
      const repo: MemberRepository = repository;
      expect(typeof repo.findById).toBe('function');
      expect(typeof repo.findByEmail).toBe('function');
      expect(typeof repo.findAll).toBe('function');
      expect(typeof repo.findByTier).toBe('function');
      expect(typeof repo.findActive).toBe('function');
      expect(typeof repo.findWithActiveRentals).toBe('function');
      expect(typeof repo.findByJoinDateRange).toBe('function');
      expect(typeof repo.save).toBe('function');
      expect(typeof repo.delete).toBe('function');
      expect(typeof repo.exists).toBe('function');
      expect(typeof repo.emailExists).toBe('function');
      expect(typeof repo.count).toBe('function');
      expect(typeof repo.countActive).toBe('function');
      expect(typeof repo.countByTier).toBe('function');
    });
  });
});
