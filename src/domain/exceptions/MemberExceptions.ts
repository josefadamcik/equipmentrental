import { DomainException } from './DomainException';

/**
 * Thrown when a member cannot be found
 */
export class MemberNotFoundError extends DomainException {
  constructor(memberId: string, metadata?: Record<string, unknown>) {
    super(`Member not found with ID: ${memberId}`, 'MEMBER_NOT_FOUND', {
      memberId,
      ...metadata,
    });
  }
}

/**
 * Thrown when a member's account is suspended and cannot perform operations
 */
export class MemberSuspendedError extends DomainException {
  constructor(memberId: string, reason: string, metadata?: Record<string, unknown>) {
    super(`Member ${memberId} is suspended: ${reason}`, 'MEMBER_SUSPENDED', {
      memberId,
      reason,
      ...metadata,
    });
  }
}

/**
 * Thrown when a member exceeds their rental limit based on membership tier
 */
export class RentalLimitExceededError extends DomainException {
  constructor(
    memberId: string,
    currentRentals: number,
    maxAllowed: number,
    metadata?: Record<string, unknown>,
  ) {
    super(
      `Member ${memberId} has reached rental limit (${currentRentals}/${maxAllowed})`,
      'RENTAL_LIMIT_EXCEEDED',
      { memberId, currentRentals, maxAllowed, ...metadata },
    );
  }
}

/**
 * Thrown when a member has overdue rentals and cannot create new rentals
 */
export class MemberHasOverdueRentalsError extends DomainException {
  constructor(memberId: string, overdueCount: number, metadata?: Record<string, unknown>) {
    super(
      `Member ${memberId} has ${overdueCount} overdue rental(s)`,
      'MEMBER_HAS_OVERDUE_RENTALS',
      { memberId, overdueCount, ...metadata },
    );
  }
}

/**
 * Thrown when a member's account is inactive
 */
export class MemberInactiveError extends DomainException {
  constructor(memberId: string, metadata?: Record<string, unknown>) {
    super(`Member ${memberId} account is inactive`, 'MEMBER_INACTIVE', { memberId, ...metadata });
  }
}

/**
 * Thrown when a member does not have sufficient privileges for an operation
 */
export class InsufficientMemberTierError extends DomainException {
  constructor(
    memberId: string,
    currentTier: string,
    requiredTier: string,
    metadata?: Record<string, unknown>,
  ) {
    super(
      `Member ${memberId} tier '${currentTier}' is insufficient (requires '${requiredTier}')`,
      'INSUFFICIENT_MEMBER_TIER',
      { memberId, currentTier, requiredTier, ...metadata },
    );
  }
}
