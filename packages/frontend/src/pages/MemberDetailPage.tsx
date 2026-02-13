/**
 * Member detail page.
 * Shows all information about a single member, including their rental history.
 */

import { Link, useParams } from 'react-router-dom';
import { getMember, getMemberRentals } from '../api/members';
import { useApi } from '../hooks/useApi';
import { TierBadge, ActiveStatusBadge } from '../components/members/TierBadge';

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

const STATUS_LABELS: Record<string, string> = {
  RESERVED: 'Reserved',
  ACTIVE: 'Active',
  OVERDUE: 'Overdue',
  RETURNED: 'Returned',
  CANCELLED: 'Cancelled',
};

const STATUS_CLASSES: Record<string, string> = {
  RESERVED: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  RETURNED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-yellow-100 text-yellow-800',
};

const BackIcon = () => (
  <svg
    className="mr-1 h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ErrorIcon = () => (
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
);

const Spinner = () => (
  <svg
    className="h-8 w-8 animate-spin text-indigo-600"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: member, loading, error } = useApi(
    () => getMember(id ?? ''),
    [id],
  );

  const {
    data: rentals,
    loading: rentalsLoading,
    error: rentalsError,
  } = useApi(
    () => getMemberRentals(id ?? ''),
    [id],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
        <span className="ml-3 text-sm text-gray-500">Loading member…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Link
          to="/members"
          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          <BackIcon />
          Back to list
        </Link>
        <div className="mt-4 rounded-lg bg-red-50 p-4 shadow">
          <div className="flex">
            <ErrorIcon />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Failed to load member</h3>
              <p className="mt-1 text-sm text-red-700">{error.error.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!member) {
    return null;
  }

  return (
    <div>
      {/* Breadcrumb / back link */}
      <Link
        to="/members"
        className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
      >
        <BackIcon />
        Back to list
      </Link>

      {/* Page header */}
      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{member.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{member.email}</p>
        </div>
        <Link
          to={`/members/${member.memberId}/edit`}
          className="inline-flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <svg
            className="-ml-0.5 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.862 3.487a2.25 2.25 0 1 1 3.182 3.182L7.5 19.213l-4 1 1-4 12.362-12.726z"
            />
          </svg>
          Edit
        </Link>
      </div>

      {/* Profile card */}
      <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-sm font-medium text-gray-500">Membership Tier</dt>
            <dd className="mt-1">
              <TierBadge tier={member.tier} />
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1">
              <ActiveStatusBadge isActive={member.isActive} />
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Active Rentals</dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900">
              {member.activeRentalCount}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Member Since</dt>
            <dd className="mt-1 text-sm text-gray-700">{formatDate(member.joinDate)}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Member ID</dt>
            <dd className="mt-1 text-sm font-mono text-gray-700 break-all">{member.memberId}</dd>
          </div>
        </dl>
      </div>

      {/* Rental history */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Rental History</h2>

        <div className="mt-4">
          {rentalsLoading && (
            <div className="flex items-center justify-center rounded-lg bg-white py-10 shadow">
              <Spinner />
              <span className="ml-3 text-sm text-gray-500">Loading rentals…</span>
            </div>
          )}

          {!rentalsLoading && rentalsError && (
            <div className="rounded-lg bg-red-50 p-4 shadow">
              <div className="flex">
                <ErrorIcon />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Failed to load rentals</h3>
                  <p className="mt-1 text-sm text-red-700">{rentalsError.error.message}</p>
                </div>
              </div>
            </div>
          )}

          {!rentalsLoading && !rentalsError && rentals && rentals.length === 0 && (
            <div className="bg-white rounded-lg shadow px-6 py-10 text-center">
              <svg
                className="mx-auto h-10 w-10 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"
                />
              </svg>
              <p className="mt-3 text-sm text-gray-500">No rental history found for this member.</p>
            </div>
          )}

          {!rentalsLoading && !rentalsError && rentals && rentals.length > 0 && (
            <div className="overflow-hidden rounded-lg bg-white shadow">
              {/* Desktop table */}
              <div className="hidden sm:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Equipment
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
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Total Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {rentals.map((rental) => {
                      const statusClass =
                        STATUS_CLASSES[rental.status] ?? 'bg-gray-100 text-gray-800';
                      const statusLabel = STATUS_LABELS[rental.status] ?? rental.status;
                      return (
                        <tr key={rental.rentalId}>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="text-sm font-medium text-gray-900">
                              {rental.equipmentName}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {formatDate(rental.startDate)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {formatDate(rental.endDate)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}
                            >
                              {statusLabel}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {formatCurrency(rental.totalCost)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <ul className="divide-y divide-gray-200 sm:hidden">
                {rentals.map((rental) => {
                  const statusClass =
                    STATUS_CLASSES[rental.status] ?? 'bg-gray-100 text-gray-800';
                  const statusLabel = STATUS_LABELS[rental.status] ?? rental.status;
                  return (
                    <li key={rental.rentalId} className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {rental.equipmentName}
                        </p>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                        <span>{formatDate(rental.startDate)}</span>
                        <span>&ndash;</span>
                        <span>{formatDate(rental.endDate)}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-900 font-medium">
                        {formatCurrency(rental.totalCost)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
