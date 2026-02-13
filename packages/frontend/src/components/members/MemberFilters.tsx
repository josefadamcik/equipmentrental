/**
 * Filter bar for the members list page.
 * Provides a search input, tier dropdown, and status dropdown.
 */

import { MembershipTier } from '../../types/api';

export interface MemberFilterValues {
  search: string;
  tier: string;
  status: string;
}

interface MemberFiltersProps {
  values: MemberFilterValues;
  onChange: (values: MemberFilterValues) => void;
}

const TIERS = Object.values(MembershipTier);

const TIER_LABELS: Record<string, string> = {
  BASIC: 'Basic',
  SILVER: 'Silver',
  GOLD: 'Gold',
  PLATINUM: 'Platinum',
};

export default function MemberFilters({ values, onChange }: MemberFiltersProps) {
  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    onChange({ ...values, search: e.target.value });
  }

  function handleTier(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange({ ...values, tier: e.target.value });
  }

  function handleStatus(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange({ ...values, status: e.target.value });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg
            className="h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search by name or email…"
          value={values.search}
          onChange={handleSearch}
          className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Tier filter */}
      <select
        value={values.tier}
        onChange={handleTier}
        className="rounded-md border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">All tiers</option>
        {TIERS.map((tier) => (
          <option key={tier} value={tier}>
            {TIER_LABELS[tier] ?? tier}
          </option>
        ))}
      </select>

      {/* Status filter */}
      <select
        value={values.status}
        onChange={handleStatus}
        className="rounded-md border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  );
}
