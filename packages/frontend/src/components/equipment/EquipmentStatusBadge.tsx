/**
 * Badge components for equipment condition and availability status.
 */

import type { EquipmentCondition } from '../../types/api';

// ---------------------------------------------------------------------------
// Condition badge
// ---------------------------------------------------------------------------

interface ConditionBadgeProps {
  condition: string;
}

const conditionConfig: Record<
  string,
  { label: string; className: string }
> = {
  EXCELLENT: {
    label: 'Excellent',
    className: 'bg-green-100 text-green-800',
  },
  GOOD: {
    label: 'Good',
    className: 'bg-blue-100 text-blue-800',
  },
  FAIR: {
    label: 'Fair',
    className: 'bg-yellow-100 text-yellow-800',
  },
  POOR: {
    label: 'Poor',
    className: 'bg-orange-100 text-orange-800',
  },
  DAMAGED: {
    label: 'Damaged',
    className: 'bg-red-100 text-red-800',
  },
  UNDER_REPAIR: {
    label: 'Under Repair',
    className: 'bg-gray-100 text-gray-800',
  },
};

export function ConditionBadge({ condition }: ConditionBadgeProps) {
  const config = conditionConfig[condition] ?? {
    label: condition,
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
// Availability badge
// ---------------------------------------------------------------------------

interface AvailabilityBadgeProps {
  isAvailable: boolean;
  /** Optional override label */
  label?: string;
}

export function AvailabilityBadge({ isAvailable, label }: AvailabilityBadgeProps) {
  if (isAvailable) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        {label ?? 'Available'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
      {label ?? 'Unavailable'}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Re-export the EquipmentCondition type so consumers can import from here
// ---------------------------------------------------------------------------
export type { EquipmentCondition };
