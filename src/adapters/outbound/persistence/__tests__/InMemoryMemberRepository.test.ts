import { InMemoryMemberRepository } from '../InMemoryMemberRepository.js';
import { Member } from '../../../../domain/entities/Member.js';
import { MemberId } from '../../../../domain/value-objects/identifiers.js';
import { MembershipTier } from '../../../../domain/types/MembershipTier.js';

describe('InMemoryMemberRepository', () => {
  let repository: InMemoryMemberRepository;

  beforeEach(() => {
    repository = new InMemoryMemberRepository();
  });

  describe('save and findById', () => {
    it('should save and retrieve member by id', async () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      await repository.save(member);

      const found = await repository.findById(member.id);
      expect(found).toBeDefined();
      expect(found?.id.value).toBe(member.id.value);
      expect(found?.name).toBe('John Doe');
    });

    it('should return undefined for non-existent id', async () => {
      const id = MemberId.generate();
      const found = await repository.findById(id);
      expect(found).toBeUndefined();
    });
  });

  describe('findByEmail', () => {
    it('should find member by email', async () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      await repository.save(member);

      const found = await repository.findByEmail('john@example.com');
      expect(found).toBeDefined();
      expect(found?.name).toBe('John Doe');
    });

    it('should be case-insensitive', async () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      await repository.save(member);

      const found = await repository.findByEmail('JOHN@EXAMPLE.COM');
      expect(found).toBeDefined();
      expect(found?.name).toBe('John Doe');
    });

    it('should return undefined for non-existent email', async () => {
      const found = await repository.findByEmail('nonexistent@example.com');
      expect(found).toBeUndefined();
    });
  });

  describe('email uniqueness', () => {
    it('should enforce email uniqueness', async () => {
      const member1 = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      const member2 = Member.create({
        name: 'Jane Doe',
        email: 'john@example.com',
        tier: MembershipTier.SILVER,
        joinDate: new Date(),
        isActive: true,
      });

      await repository.save(member1);

      await expect(repository.save(member2)).rejects.toThrow('already registered');
    });

    it('should allow updating member with same email', async () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      await repository.save(member);

      member.updateName('John Smith');
      await expect(repository.save(member)).resolves.not.toThrow();

      const found = await repository.findById(member.id);
      expect(found?.name).toBe('John Smith');
    });

    it('should update email index when member email changes', async () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      await repository.save(member);

      member.updateEmail('newemail@example.com');
      await repository.save(member);

      const foundByOld = await repository.findByEmail('john@example.com');
      expect(foundByOld).toBeUndefined();

      const foundByNew = await repository.findByEmail('newemail@example.com');
      expect(foundByNew).toBeDefined();
      expect(foundByNew?.name).toBe('John Doe');
    });
  });

  describe('findByTier', () => {
    it('should return members by tier', async () => {
      const basic = Member.create({
        name: 'Basic Member',
        email: 'basic@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      const silver = Member.create({
        name: 'Silver Member',
        email: 'silver@example.com',
        tier: MembershipTier.SILVER,
        joinDate: new Date(),
        isActive: true,
      });

      await repository.save(basic);
      await repository.save(silver);

      const basicMembers = await repository.findByTier(MembershipTier.BASIC);
      expect(basicMembers).toHaveLength(1);
      expect(basicMembers[0].name).toBe('Basic Member');
    });
  });

  describe('findActive', () => {
    it('should return only active members', async () => {
      const active = Member.create({
        name: 'Active Member',
        email: 'active@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      const inactive = Member.create({
        name: 'Inactive Member',
        email: 'inactive@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: false,
      });

      await repository.save(active);
      await repository.save(inactive);

      const activeMembers = await repository.findActive();
      expect(activeMembers).toHaveLength(1);
      expect(activeMembers[0].name).toBe('Active Member');
    });
  });

  describe('findWithActiveRentals', () => {
    it('should return members with active rentals', async () => {
      const withRentals = Member.create({
        name: 'Member With Rentals',
        email: 'with@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });
      withRentals.incrementActiveRentals();

      const withoutRentals = Member.create({
        name: 'Member Without Rentals',
        email: 'without@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      await repository.save(withRentals);
      await repository.save(withoutRentals);

      const members = await repository.findWithActiveRentals();
      expect(members).toHaveLength(1);
      expect(members[0].name).toBe('Member With Rentals');
    });
  });

  describe('findByJoinDateRange', () => {
    it('should return members who joined in date range', async () => {
      const jan1 = new Date('2024-01-01');
      const jan15 = new Date('2024-01-15');
      const feb1 = new Date('2024-02-01');

      const member1 = Member.create({
        name: 'January Member',
        email: 'jan@example.com',
        tier: MembershipTier.BASIC,
        joinDate: jan1,
        isActive: true,
      });

      const member2 = Member.create({
        name: 'February Member',
        email: 'feb@example.com',
        tier: MembershipTier.BASIC,
        joinDate: feb1,
        isActive: true,
      });

      await repository.save(member1);
      await repository.save(member2);

      const members = await repository.findByJoinDateRange(jan1, jan15);
      expect(members).toHaveLength(1);
      expect(members[0].name).toBe('January Member');
    });
  });

  describe('delete', () => {
    it('should delete member and remove from email index', async () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      await repository.save(member);
      await repository.delete(member.id);

      const foundById = await repository.findById(member.id);
      expect(foundById).toBeUndefined();

      const foundByEmail = await repository.findByEmail('john@example.com');
      expect(foundByEmail).toBeUndefined();

      const emailExists = await repository.emailExists('john@example.com');
      expect(emailExists).toBe(false);
    });
  });

  describe('exists and emailExists', () => {
    it('should check if member exists by id', async () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      await repository.save(member);

      expect(await repository.exists(member.id)).toBe(true);

      const nonExistentId = MemberId.generate();
      expect(await repository.exists(nonExistentId)).toBe(false);
    });

    it('should check if email exists', async () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      await repository.save(member);

      expect(await repository.emailExists('john@example.com')).toBe(true);
      expect(await repository.emailExists('JOHN@EXAMPLE.COM')).toBe(true);
      expect(await repository.emailExists('nonexistent@example.com')).toBe(false);
    });
  });

  describe('count methods', () => {
    beforeEach(async () => {
      const basic1 = Member.create({
        name: 'Basic 1',
        email: 'basic1@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      const basic2 = Member.create({
        name: 'Basic 2',
        email: 'basic2@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: false,
      });

      const silver = Member.create({
        name: 'Silver',
        email: 'silver@example.com',
        tier: MembershipTier.SILVER,
        joinDate: new Date(),
        isActive: true,
      });

      await repository.save(basic1);
      await repository.save(basic2);
      await repository.save(silver);
    });

    it('should count total members', async () => {
      expect(await repository.count()).toBe(3);
    });

    it('should count active members', async () => {
      expect(await repository.countActive()).toBe(2);
    });

    it('should count members by tier', async () => {
      expect(await repository.countByTier(MembershipTier.BASIC)).toBe(2);
      expect(await repository.countByTier(MembershipTier.SILVER)).toBe(1);
      expect(await repository.countByTier(MembershipTier.GOLD)).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all members and email index', async () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      await repository.save(member);
      expect(await repository.count()).toBe(1);

      repository.clear();
      expect(await repository.count()).toBe(0);
      expect(await repository.emailExists('john@example.com')).toBe(false);
    });
  });

  describe('data isolation', () => {
    it('should return clones to prevent external mutations', async () => {
      const member = Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        tier: MembershipTier.BASIC,
        joinDate: new Date(),
        isActive: true,
      });

      await repository.save(member);

      const found1 = await repository.findById(member.id);
      const found2 = await repository.findById(member.id);

      // Modifying one shouldn't affect the other
      found1?.updateName('Jane Doe');

      expect(found2?.name).toBe('John Doe');

      // Also shouldn't affect what's in the repository
      const found3 = await repository.findById(member.id);
      expect(found3?.name).toBe('John Doe');
    });
  });
});
