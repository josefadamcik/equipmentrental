/**
 * RecentActivityList - Shows the most recent overdue rentals on the dashboard.
 *
 * Fetches data from GET /api/rentals/status/overdue and renders a scrollable
 * list of rental rows with status badges and links to the detail page.
 */

import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { getOverdueRentals } from '../../api/rentals';
import RentalStatusBadge from '../rentals/RentalStatusBadge';

/** Truncate a UUID-style ID to a readable short form: first 8 chars. */
function shortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function RecentActivityList() {
  const { data: rentals, loading, error } = useApi(() => getOverdueRentals(), []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-14 rounded bg-gray-200 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        Failed to load overdue rentals: {error.error.message}
      </p>
    );
  }

  if (!rentals || rentals.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">No overdue rentals</p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {rentals.map((rental) => (
        <li key={rental.rentalId}>
          <Link
            to={`/rentals/${rental.rentalId}`}
            className="flex items-center justify-between py-3 px-1 hover:bg-gray-50 rounded transition-colors"
          >
            {/* Left: IDs and dates */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                Rental{' '}
                <span className="font-mono text-xs text-gray-600">
                  {shortId(rental.rentalId)}
                </span>
              </p>
              <p className="text-xs text-gray-500 truncate">
                Equipment:{' '}
                <span className="font-mono">{shortId(rental.equipmentId)}</span>
                {' · '}
                Due {formatDate(rental.endDate)}
              </p>
            </div>

            {/* Right: status badge */}
            <div className="ml-4 flex-shrink-0">
              <RentalStatusBadge status={rental.status} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
