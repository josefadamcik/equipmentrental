/**
 * Reservation detail page.
 *
 * Fetches and displays full reservation details. Action buttons are shown
 * based on the current status:
 *   PENDING   - "Confirm" (blue) and "Cancel" (red outline)
 *   CONFIRMED - "Fulfill" (green) and "Cancel" (red outline)
 *   CANCELLED / FULFILLED / EXPIRED - no actions, informational banner
 */

import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  getReservation,
  confirmReservation,
  cancelReservation,
  fulfillReservation,
} from '../api/reservations';
import { useApi } from '../hooks/useApi';
import ReservationStatusBadge from '../components/reservations/ReservationStatusBadge';

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

// ---------------------------------------------------------------------------
// Inline confirmation widget (avoid browser confirm() which has UX issues)
// ---------------------------------------------------------------------------
interface InlineConfirmProps {
  message: string;
  confirmLabel: string;
  confirmClassName: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

function InlineConfirm({
  message,
  confirmLabel,
  confirmClassName,
  cancelLabel = 'Go Back',
  onConfirm,
  onCancel,
  disabled = false,
}: InlineConfirmProps) {
  return (
    <div className="rounded-md bg-amber-50 border border-amber-200 p-4">
      <p className="text-sm text-amber-800">{message}</p>
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={disabled}
          className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 ${confirmClassName}`}
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------
function Spinner({ label }: { label: string }) {
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
      <span className="ml-3 text-sm text-gray-500">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
type PendingAction = 'confirm' | 'cancel' | 'fulfill' | null;

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: reservation, loading, error, refetch } = useApi(
    () => getReservation(id ?? ''),
    [id],
  );

  // Which action button is pending user confirmation
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  // Action in-flight state
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fulfill result state (to show rental ID after fulfillment)
  const [fulfilledRentalId, setFulfilledRentalId] = useState<string | null>(null);

  async function handleConfirm() {
    if (!id) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await confirmReservation(id);
      setPendingAction(null);
      refetch();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to confirm reservation');
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!id) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await cancelReservation(id);
      setPendingAction(null);
      refetch();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel reservation');
      setActionLoading(false);
    }
  }

  async function handleFulfill() {
    if (!id) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const result = await fulfillReservation(id, {
        paymentMethod: { type: 'CREDIT_CARD' },
      });
      setFulfilledRentalId(result.rentalId);
      setPendingAction(null);
      refetch();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to fulfill reservation');
      setActionLoading(false);
    }
  }

  function dismissAction() {
    setPendingAction(null);
    setActionError(null);
  }

  if (loading) {
    return <Spinner label="Loading reservation\u2026" />;
  }

  if (error) {
    return (
      <div>
        <Link
          to="/reservations"
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
          Back to Reservations
        </Link>
        <div className="mt-4 rounded-lg bg-red-50 p-4 shadow">
          <p className="text-sm font-medium text-red-800">{error.error.message}</p>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return null;
  }

  const isPending = reservation.status === 'PENDING';
  const isConfirmed = reservation.status === 'CONFIRMED';
  const isTerminal =
    reservation.status === 'CANCELLED' ||
    reservation.status === 'FULFILLED' ||
    reservation.status === 'EXPIRED';

  return (
    <div>
      {/* Back link */}
      <Link
        to="/reservations"
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
        Back to Reservations
      </Link>

      {/* Page header */}
      <div className="mt-4 flex items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Reservation Details</h1>
        <ReservationStatusBadge status={reservation.status} />
      </div>

      {/* Action error banner */}
      {actionError && (
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
            <p className="ml-3 text-sm text-red-700">{actionError}</p>
          </div>
        </div>
      )}

      {/* Fulfilled rental link */}
      {fulfilledRentalId && (
        <div className="mt-4 rounded-md bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-green-800">
              Reservation fulfilled. A new rental has been created.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/rentals/${fulfilledRentalId}`)}
              className="ml-4 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              View Rental
            </button>
          </div>
        </div>
      )}

      {/* Action buttons — shown when no action is pending */}
      {pendingAction === null && !actionLoading && (
        <>
          {/* PENDING actions */}
          {isPending && (
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setPendingAction('confirm')}
                className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setPendingAction('cancel')}
                className="inline-flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Cancel Reservation
              </button>
            </div>
          )}

          {/* CONFIRMED actions */}
          {isConfirmed && (
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setPendingAction('fulfill')}
                className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Fulfill (Convert to Rental)
              </button>
              <button
                type="button"
                onClick={() => setPendingAction('cancel')}
                className="inline-flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Cancel Reservation
              </button>
            </div>
          )}

          {/* Terminal status info banner */}
          {isTerminal && (
            <div className="mt-4 rounded-md bg-gray-50 border border-gray-200 p-4 max-w-lg">
              <p className="text-sm text-gray-600">
                This reservation is{' '}
                <span className="font-medium">{reservation.status.toLowerCase()}</span> and no
                further actions are available.
              </p>
            </div>
          )}
        </>
      )}

      {/* Inline confirmation dialogs */}
      {pendingAction === 'confirm' && (
        <div className="mt-4 max-w-lg">
          <InlineConfirm
            message="Are you sure you want to confirm this reservation? The member will be notified."
            confirmLabel={actionLoading ? 'Confirming\u2026' : 'Yes, Confirm'}
            confirmClassName="bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
            onConfirm={handleConfirm}
            onCancel={dismissAction}
            disabled={actionLoading}
          />
        </div>
      )}

      {pendingAction === 'cancel' && (
        <div className="mt-4 max-w-lg">
          <InlineConfirm
            message="Are you sure you want to cancel this reservation? This action cannot be undone."
            confirmLabel={actionLoading ? 'Cancelling\u2026' : 'Yes, Cancel Reservation'}
            confirmClassName="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            onConfirm={handleCancel}
            onCancel={dismissAction}
            disabled={actionLoading}
          />
        </div>
      )}

      {pendingAction === 'fulfill' && (
        <div className="mt-4 max-w-lg">
          <InlineConfirm
            message="Fulfilling this reservation will create a new active rental for the reserved period. Proceed?"
            confirmLabel={actionLoading ? 'Fulfilling\u2026' : 'Yes, Fulfill Reservation'}
            confirmClassName="bg-green-600 hover:bg-green-700 focus:ring-green-500"
            onConfirm={handleFulfill}
            onCancel={dismissAction}
            disabled={actionLoading}
          />
        </div>
      )}

      {/* Action in-flight spinner */}
      {actionLoading && (
        <div className="mt-4 flex items-center gap-2">
          <svg
            className="h-5 w-5 animate-spin text-indigo-600"
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
          <span className="text-sm text-gray-500">Processing\u2026</span>
        </div>
      )}

      {/* Main details card */}
      <div className="mt-6 bg-white rounded-lg shadow-sm p-6 max-w-2xl">
        <h2 className="text-base font-semibold text-gray-900">Reservation Information</h2>
        <dl className="mt-4 divide-y divide-gray-100 text-sm">
          <div className="flex justify-between py-2.5">
            <dt className="text-gray-500">Reservation ID</dt>
            <dd className="font-mono text-gray-900 break-all">{reservation.reservationId}</dd>
          </div>
          <div className="flex justify-between py-2.5">
            <dt className="text-gray-500">Equipment ID</dt>
            <dd className="font-mono break-all">
              <Link to={`/equipment/${reservation.equipmentId}`} className="text-indigo-600 hover:text-indigo-500">
                {reservation.equipmentId}
              </Link>
            </dd>
          </div>
          <div className="flex justify-between py-2.5">
            <dt className="text-gray-500">Member ID</dt>
            <dd className="font-mono break-all">
              <Link to={`/members/${reservation.memberId}`} className="text-indigo-600 hover:text-indigo-500">
                {reservation.memberId}
              </Link>
            </dd>
          </div>
          <div className="flex justify-between py-2.5">
            <dt className="text-gray-500">Start Date</dt>
            <dd className="text-gray-900">{formatDate(reservation.startDate)}</dd>
          </div>
          <div className="flex justify-between py-2.5">
            <dt className="text-gray-500">End Date</dt>
            <dd className="text-gray-900">{formatDate(reservation.endDate)}</dd>
          </div>
          <div className="flex justify-between py-2.5">
            <dt className="text-gray-500">Status</dt>
            <dd>
              <ReservationStatusBadge status={reservation.status} />
            </dd>
          </div>
          <div className="flex justify-between py-2.5">
            <dt className="text-gray-500">Created At</dt>
            <dd className="text-gray-900">{formatDate(reservation.createdAt)}</dd>
          </div>
        </dl>

        {/* Navigation links to related resources */}
        <div className="mt-6 flex gap-3">
          <Link
            to={`/equipment/${reservation.equipmentId}`}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            View Equipment &rarr;
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            to={`/members/${reservation.memberId}`}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            View Member &rarr;
          </Link>
        </div>
      </div>

      {/* Estimated cost note for PENDING/CONFIRMED */}
      {(isPending || isConfirmed) && (
        <p className="mt-4 text-xs text-gray-400 max-w-2xl">
          Note: The estimated cost shown at creation time may vary if rates or discounts change
          before the reservation is fulfilled. The final cost is charged when the reservation is
          fulfilled and converted to a rental. Daily rate:{' '}
          {formatCurrency(0)} &mdash; see equipment page for current rate.
        </p>
      )}
    </div>
  );
}
