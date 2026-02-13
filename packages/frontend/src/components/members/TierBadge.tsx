/**
 * Badge components for membership tier and member active/inactive status.
 */

import type { MembershipTier } from '../../types/api';

// ---------------------------------------------------------------------------
// Tier badge
// ---------------------------------------------------------------------------

interface TierBadgeProps {
  tier: string;
}

const tierConfig: Record<
  string,
  { label: string; className: string }
> = {
  BASIC: {
    label: 'Basic',
    className: 'bg-gray-100 text-gray-800',
  },
  SILVER: {
    label: 'Silver',
    className: 'bg-slate-100 text-slate-700',
  },
  GOLD: {
    label: 'Gold',
    className: 'bg-amber-100 text-amber-800',
  },
  PLATINUM: {
    label: 'Platinum',
    className: 'bg-purple-100 text-purple-800',
  },
};

export function TierBadge({ tier }: TierBadgeProps) {
  const config = tierConfig[tier] ?? {
    label: tier,
    className: 'bg-gray-100 text-gray-800',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Active status badge
// ---------------------------------------------------------------------------

interface ActiveStatusBadgeProps {
  isActive: boolean;
}

export function ActiveStatusBadge({ isActive }: ActiveStatusBadgeProps) {
  if (isActive) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
      Inactive
    </span>
  );
}

// ---------------------------------------------------------------------------
// Re-export the MembershipTier type so consumers can import from here
// ---------------------------------------------------------------------------
export type { MembershipTier };
