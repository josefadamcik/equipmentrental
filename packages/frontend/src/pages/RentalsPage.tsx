/**
 * Rentals overview page.
 *
 * Shows overdue rentals and provides a member-ID search to find
 * rentals for a specific member, plus a "Create Rental" button.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getOverdueRentals, getMemberRentals } from '../api/rentals';
import { useApi } from '../hooks/useApi';
import RentalTable from '../components/rentals/RentalTable';
import type { RentalResponse } from '../types/api';
import { ApiRequestError } from '../api/client';

// ---------------------------------------------------------------------------
// Spinner helper
// ---------------------------------------------------------------------------
function Spinner() {
  return (
    <div className="flex items-center justify-center rounded-lg bg-white py-12 shadow">
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
      <span className="ml-3 text-sm text-gray-500">Loading…</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error banner helper
// ---------------------------------------------------------------------------
function ErrorBanner({ message }: { message: string }) {
  return (
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
          <p className="text-sm text-red-700">{message}</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Member-search section (lazy, not via useApi since it's on-demand)
// ---------------------------------------------------------------------------
function MemberRentalsSection() {
  const [memberId, setMemberId] = useState('');
  const [submittedId, setSubmittedId] = useState('');
  const [memberRentals, setMemberRentals] = useState<RentalResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = memberId.trim();
    if (!trimmed) return;

    setLoading(true);
    setSearchError(null);
    setMemberRentals(null);
    setSubmittedId(trimmed);

    try {
      const results = await getMemberRentals(trimmed);
      setMemberRentals(results);
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) {
        setSearchError(err.body.error.message);
      } else if (err instanceof Error) {
        setSearchError(err.message);
      } else {
        setSearchError('Failed to load member rentals');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-10">
      <h2 className="text-lg font-semibold text-gray-900">Search by Member</h2>
      <p className="mt-1 text-sm text-gray-500">Enter a member ID to view their rental history.</p>

      <form onSubmit={handleSearch} className="mt-3 flex gap-3">
        <input
          type="text"
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          placeholder="Member ID"
          className="block w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={loading || !memberId.trim()}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60"
        >
          {loading && (
            <svg
              className="h-4 w-4 animate-spin"
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
          )}
          Search
        </button>
      </form>

      {searchError && (
        <div className="mt-4">
          <ErrorBanner message={searchError} />
        </div>
      )}

      {memberRentals !== null && !loading && !searchError && (
        <div className="mt-4">
          <p className="mb-2 text-sm text-gray-500">
            {memberRentals.length === 0
              ? `No rentals found for member ${submittedId}.`
              : `${memberRentals.length} rental${memberRentals.length === 1 ? '' : 's'} found for member ${submittedId}.`}
          </p>
          {memberRentals.length > 0 && <RentalTable rentals={memberRentals} />}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function RentalsPage() {
  const { data: overdueRentals, loading, error } = useApi(() => getOverdueRentals(), []);

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rentals</h1>
          <p className="mt-1 text-sm text-gray-500">View and manage active rentals</p>
        </div>
        <Link
          to="/rentals/new"
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
          Create Rental
        </Link>
      </div>

      {/* Overdue rentals section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Overdue Rentals</h2>
        <p className="mt-1 text-sm text-gray-500">Rentals that have passed their scheduled end date.</p>

        <div className="mt-4">
          {loading && <Spinner />}

          {!loading && error && (
            <ErrorBanner message={error.error.message} />
          )}

          {!loading && !error && (
            <>
              {overdueRentals && overdueRentals.length > 0 ? (
                <RentalTable rentals={overdueRentals} />
              ) : (
                <div className="rounded-lg bg-white px-6 py-8 text-center shadow">
                  <svg
                    className="mx-auto h-10 w-10 text-green-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
                    />
                  </svg>
                  <p className="mt-3 text-sm text-gray-500">No overdue rentals at this time.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Member search section */}
      <MemberRentalsSection />
    </div>
  );
}
