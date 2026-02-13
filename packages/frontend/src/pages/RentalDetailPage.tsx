/**
 * Rental detail page.
 *
 * Fetches and displays full rental details. If the rental is ACTIVE, shows
 * "Return" and "Extend" buttons that open the corresponding dialogs. If the
 * rental is RETURNED, shows return-specific details (return date, fees,
 * condition at return).
 */

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getRental } from '../api/rentals';
import { useApi } from '../hooks/useApi';
import RentalStatusBadge from '../components/rentals/RentalStatusBadge';
import ReturnRentalDialog from '../components/rentals/ReturnRentalDialog';
import ExtendRentalDialog from '../components/rentals/ExtendRentalDialog';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function RentalDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: rental, loading, error, refetch } = useApi(
    () => getRental(id ?? ''),
    [id],
  );

  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);

  function handleReturnSuccess(): void {
    setShowReturnDialog(false);
    refetch();
  }

  function handleExtendSuccess(): void {
    setShowExtendDialog(false);
    refetch();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
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
        <span className="ml-3 text-sm text-gray-500">Loading rental…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Link
          to="/rentals"
          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
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
          Back to Rentals
        </Link>
        <div className="mt-4 rounded-lg bg-red-50 p-4 shadow">
          <p className="text-sm font-medium text-red-800">{error.error.message}</p>
        </div>
      </div>
    );
  }

  if (!rental) {
    return null;
  }

  const isActive = rental.status === 'ACTIVE' || rental.status === 'OVERDUE';
  const isReturned = rental.status === 'RETURNED';

  return (
    <>
      <div>
        {/* Back link */}
        <Link
          to="/rentals"
          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
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
          Back to Rentals
        </Link>

        {/* Page header */}
        <div className="mt-4 flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Rental Details</h1>
          <RentalStatusBadge status={rental.status} />
        </div>

        {/* Action buttons for active rentals */}
        {isActive && (
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setShowReturnDialog(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Return Rental
            </button>
            <button
              type="button"
              onClick={() => setShowExtendDialog(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Extend Rental
            </button>
          </div>
        )}

        {/* Main details card */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6 max-w-2xl">
          <h2 className="text-base font-semibold text-gray-900">Rental Information</h2>
          <dl className="mt-4 divide-y divide-gray-100 text-sm">
            <div className="flex justify-between py-2.5">
              <dt className="text-gray-500">Rental ID</dt>
              <dd className="font-mono text-gray-900">{rental.rentalId}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-gray-500">Equipment ID</dt>
              <dd className="font-mono text-gray-900">{rental.equipmentId}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-gray-500">Member ID</dt>
              <dd className="font-mono text-gray-900">{rental.memberId}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-gray-500">Start Date</dt>
              <dd className="text-gray-900">{formatDate(rental.startDate)}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-gray-500">End Date</dt>
              <dd className="text-gray-900">{formatDate(rental.endDate)}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-gray-500">Status</dt>
              <dd>
                <RentalStatusBadge status={rental.status} />
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-gray-500">Total Cost</dt>
              <dd className="font-medium text-gray-900">{formatCurrency(rental.totalCost)}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-gray-500">Condition at Start</dt>
              <dd className="text-gray-900">{rental.conditionAtStart}</dd>
            </div>
          </dl>

          {/* Return details (shown when RETURNED) */}
          {isReturned && (
            <>
              <h2 className="mt-6 text-base font-semibold text-gray-900">Return Details</h2>
              <dl className="mt-4 divide-y divide-gray-100 text-sm">
                {rental.actualReturnDate && (
                  <div className="flex justify-between py-2.5">
                    <dt className="text-gray-500">Return Date</dt>
                    <dd className="text-gray-900">{formatDate(rental.actualReturnDate)}</dd>
                  </div>
                )}
                {rental.conditionAtReturn && (
                  <div className="flex justify-between py-2.5">
                    <dt className="text-gray-500">Condition at Return</dt>
                    <dd className="text-gray-900">{rental.conditionAtReturn}</dd>
                  </div>
                )}
                {rental.lateFee !== undefined && rental.lateFee > 0 && (
                  <div className="flex justify-between py-2.5">
                    <dt className="text-gray-500">Late Fee</dt>
                    <dd className="font-medium text-red-600">{formatCurrency(rental.lateFee)}</dd>
                  </div>
                )}
              </dl>
            </>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {showReturnDialog && id && (
        <ReturnRentalDialog
          rentalId={id}
          onClose={() => setShowReturnDialog(false)}
          onSuccess={handleReturnSuccess}
        />
      )}

      {showExtendDialog && id && (
        <ExtendRentalDialog
          rentalId={id}
          onClose={() => setShowExtendDialog(false)}
          onSuccess={handleExtendSuccess}
        />
      )}
    </>
  );
}
