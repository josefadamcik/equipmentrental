/**
 * Represents membership tier levels with associated benefits
 */
export const MembershipTier = {
  BASIC: 'BASIC',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  PLATINUM: 'PLATINUM',
} as const;

export type MembershipTier = (typeof MembershipTier)[keyof typeof MembershipTier];

/**
 * Get discount percentage for a membership tier
 */
export function getDiscountPercentage(tier: MembershipTier): number {
  switch (tier) {
    case MembershipTier.BASIC:
      return 0;
    case MembershipTier.SILVER:
      return 5;
    case MembershipTier.GOLD:
      return 10;
    case MembershipTier.PLATINUM:
      return 15;
  }
}

/**
 * Get maximum concurrent rentals allowed for a tier
 */
export function getMaxConcurrentRentals(tier: MembershipTier): number {
  switch (tier) {
    case MembershipTier.BASIC:
      return 2;
    case MembershipTier.SILVER:
      return 3;
    case MembershipTier.GOLD:
      return 5;
    case MembershipTier.PLATINUM:
      return 10;
  }
}

/**
 * Get maximum rental duration in days for a tier
 */
export function getMaxRentalDays(tier: MembershipTier): number {
  switch (tier) {
    case MembershipTier.BASIC:
      return 7;
    case MembershipTier.SILVER:
      return 14;
    case MembershipTier.GOLD:
      return 30;
    case MembershipTier.PLATINUM:
      return 60;
  }
}

/**
 * Check if tier allows early reservations
 */
export function allowsEarlyReservations(tier: MembershipTier): boolean {
  return tier === MembershipTier.GOLD || tier === MembershipTier.PLATINUM;
}

/**
 * Get all tier values
 */
export function getMembershipTierValues(): MembershipTier[] {
  return Object.values(MembershipTier);
}
