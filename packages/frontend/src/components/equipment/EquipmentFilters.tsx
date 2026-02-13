/**
 * Filter bar for the equipment list page.
 * Provides a search input, category dropdown, and condition dropdown.
 */

import { EquipmentCondition } from '../../types/api';

export interface EquipmentFilterValues {
  search: string;
  category: string;
  condition: string;
}

interface EquipmentFiltersProps {
  values: EquipmentFilterValues;
  /** Known categories derived from the loaded equipment list */
  categories: string[];
  onChange: (values: EquipmentFilterValues) => void;
}

const CONDITIONS = Object.values(EquipmentCondition);

const CONDITION_LABELS: Record<string, string> = {
  EXCELLENT: 'Excellent',
  GOOD: 'Good',
  FAIR: 'Fair',
  POOR: 'Poor',
  DAMAGED: 'Damaged',
  UNDER_REPAIR: 'Under Repair',
};

export default function EquipmentFilters({
  values,
  categories,
  onChange,
}: EquipmentFiltersProps) {
  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    onChange({ ...values, search: e.target.value });
  }

  function handleCategory(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange({ ...values, category: e.target.value });
  }

  function handleCondition(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange({ ...values, condition: e.target.value });
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
          placeholder="Search equipment…"
          value={values.search}
          onChange={handleSearch}
          className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Category filter */}
      <select
        value={values.category}
        onChange={handleCategory}
        className="rounded-md border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">All categories</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      {/* Condition filter */}
      <select
        value={values.condition}
        onChange={handleCondition}
        className="rounded-md border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">All conditions</option>
        {CONDITIONS.map((cond) => (
          <option key={cond} value={cond}>
            {CONDITION_LABELS[cond] ?? cond}
          </option>
        ))}
      </select>
    </div>
  );
}
