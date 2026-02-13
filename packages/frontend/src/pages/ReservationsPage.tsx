/**
 * Reservations overview page.
 *
 * Since there is no "list all reservations" endpoint, this page provides:
 *   - A search-by-ID lookup to find a specific reservation
 *   - A "Create Reservation" button
 *   - Recently viewed reservations (tracked in sessionStorage)
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getReservation } from '../api/reservations';
import { ApiRequestError } from '../api/client';
import type { ReservationResponse } from '../types/api';
import ReservationStatusBadge from '../components/reservations/ReservationStatusBadge';

// ---------------------------------------------------------------------------
// Local session storage key for recent reservations
// ---------------------------------------------------------------------------
const RECENT_KEY = 'recentReservations';
const MAX_RECENT = 10;

function loadRecentReservations(): ReservationResponse[] {
  try {
    const raw = sessionStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ReservationResponse[];
  } catch {
    return [];
  }
}

function saveRecentReservation(reservation: ReservationResponse): void {
  try {
    const existing = loadRecentReservations();
    // Remove duplicate if already present
    const filtered = existing.filter((r) => r.reservationId !== reservation.reservationId);
    // Prepend new entry and trim to max
    const updated = [reservation, ...filtered].slice(0, MAX_RECENT);
    sessionStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function truncateId(id: string): string {
  return id.length > 16 ? `${id.slice(0, 16)}\u2026` : id;
}

// ---------------------------------------------------------------------------
// Spinner helper
// ---------------------------------------------------------------------------
function Spinner() {
  return (
    <div className="flex items-center gap-2">
      <svg
        className="h-4 w-4 animate-spin text-indigo-600"
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
      <span className="text-sm text-gray-500">Looking up reservation…</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function ReservationsPage() {
  const navigate = useNavigate();

  // Search state
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [found, setFound] = useState<ReservationResponse | null>(null);

  // Recent reservations (from sessionStorage)
  const [recentReservations, setRecentReservations] = useState<ReservationResponse[]>([]);

  useEffect(() => {
    setRecentReservations(loadRecentReservations());
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = searchId.trim();
    if (!trimmed) return;

    setLoading(true);
    setSearchError(null);
    setFound(null);

    try {
      const reservation = await getReservation(trimmed);
      setFound(reservation);
      saveRecentReservation(reservation);
      setRecentReservations(loadRecentReservations());
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) {
        setSearchError(err.body.error.message);
      } else if (err instanceof Error) {
        setSearchError(err.message);
      } else {
        setSearchError('Failed to find reservation');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
          <p className="mt-1 text-sm text-gray-500">Manage future equipment reservations</p>
        </div>
        <Link
          to="/reservations/new"
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
          Create Reservation
        </Link>
      </div>

      {/* Lookup by ID section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Look Up Reservation</h2>
        <p className="mt-1 text-sm text-gray-500">Enter a reservation ID to view its details.</p>

        <form onSubmit={handleSearch} className="mt-3 flex gap-3">
          <input
            type="text"
            value={searchId}
            onChange={(e) => {
              setSearchId(e.target.value);
              setSearchError(null);
              setFound(null);
            }}
            placeholder="Reservation ID"
            className="block w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading || !searchId.trim()}
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
            Look Up
          </button>
        </form>

        {/* Loading indicator */}
        {loading && (
          <div className="mt-4">
            <Spinner />
          </div>
        )}

        {/* Error state */}
        {searchError && (
          <div className="mt-4 rounded-lg bg-red-50 p-4 shadow-sm">
            <div className="flex">
              <svg
                className="h-5 w-5 text-red-400 flex-shrink-0"
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
              <p className="ml-3 text-sm text-red-700">{searchError}</p>
            </div>
          </div>
        )}

        {/* Found reservation preview */}
        {found && !loading && (
          <div className="mt-4 rounded-lg bg-white shadow-sm border border-gray-200 p-4 max-w-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Reservation</p>
                <p className="mt-0.5 font-mono text-sm text-gray-900">{truncateId(found.reservationId)}</p>
              </div>
              <ReservationStatusBadge status={found.status} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt className="text-gray-500">Start</dt>
              <dd className="text-gray-900">{formatDate(found.startDate)}</dd>
              <dt className="text-gray-500">End</dt>
              <dd className="text-gray-900">{formatDate(found.endDate)}</dd>
            </dl>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => navigate(`/reservations/${found.reservationId}`)}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                View Details
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recently viewed reservations */}
      {recentReservations.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900">Recently Viewed</h2>
          <p className="mt-1 text-sm text-gray-500">
            Reservations you have looked up in this session.
          </p>
          <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
            {/* Desktop table */}
            <div className="hidden sm:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      Reservation ID
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      Start Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      End Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      Status
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {recentReservations.map((r) => (
                    <tr
                      key={r.reservationId}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => navigate(`/reservations/${r.reservationId}`)}
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className="text-sm font-mono text-gray-900"
                          title={r.reservationId}
                        >
                          {truncateId(r.reservationId)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {formatDate(r.startDate)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {formatDate(r.endDate)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <ReservationStatusBadge status={r.status} />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <span className="text-indigo-600 hover:text-indigo-900">View</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <ul className="divide-y divide-gray-200 sm:hidden">
              {recentReservations.map((r) => (
                <li
                  key={r.reservationId}
                  className="cursor-pointer px-4 py-4 hover:bg-gray-50 transition-colors"
                  onClick={() => navigate(`/reservations/${r.reservationId}`)}
                >
                  <div className="flex items-center justify-between">
                    <p
                      className="text-sm font-mono text-gray-900 truncate"
                      title={r.reservationId}
                    >
                      {truncateId(r.reservationId)}
                    </p>
                    <ReservationStatusBadge status={r.status} />
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                    <span>{formatDate(r.startDate)}</span>
                    <span>&middot;</span>
                    <span>{formatDate(r.endDate)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
