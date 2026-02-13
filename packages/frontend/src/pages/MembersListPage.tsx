/**
 * Members list page.
 * Loads all members from the API and provides search and filter controls.
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMembers } from '../api/members';
import { useApi } from '../hooks/useApi';
import MemberFilters, { type MemberFilterValues } from '../components/members/MemberFilters';
import MemberTable from '../components/members/MemberTable';

export default function MembersListPage() {
  const { data, loading, error } = useApi(() => getMembers(), []);

  const [filters, setFilters] = useState<MemberFilterValues>({
    search: '',
    tier: '',
    status: '',
  });

  // Apply client-side filters
  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((member) => {
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesName = member.name.toLowerCase().includes(query);
        const matchesEmail = member.email.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail) return false;
      }
      if (filters.tier && member.tier !== filters.tier) {
        return false;
      }
      if (filters.status === 'active' && !member.isActive) {
        return false;
      }
      if (filters.status === 'inactive' && member.isActive) {
        return false;
      }
      return true;
    });
  }, [data, filters]);

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="mt-1 text-sm text-gray-500">Manage member accounts and tiers</p>
        </div>
        <Link
          to="/members/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <svg
            className="-ml-0.5 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Member
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-6">
        <MemberFilters values={filters} onChange={setFilters} />
      </div>

      {/* Content */}
      <div className="mt-4">
        {loading && (
          <div className="flex items-center justify-center rounded-lg bg-white py-16 shadow">
            <svg
              className="h-8 w-8 animate-spin text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="ml-3 text-sm text-gray-500">Loading members…</span>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg bg-red-50 p-4 shadow">
            <div className="flex">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Failed to load members</h3>
                <p className="mt-1 text-sm text-red-700">{error.error.message}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && <MemberTable members={filtered} />}
      </div>
    </div>
  );
}
