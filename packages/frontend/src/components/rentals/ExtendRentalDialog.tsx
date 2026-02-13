/**
 * Dialog component for extending a rental period.
 * Shows a days input and submits the extension request.
 */

import { useState } from 'react';
import { extendRental } from '../../api/rentals';
import type { ExtendRentalResult } from '../../types/api';

interface ExtendRentalDialogProps {
  rentalId: string;
  onClose: () => void;
  onSuccess: (result: ExtendRentalResult) => void;
}

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
    month: 'short',
    day: 'numeric',
  });
}

export default function ExtendRentalDialog({
  rentalId,
  onClose,
  onSuccess,
}: ExtendRentalDialogProps) {
  const [additionalDays, setAdditionalDays] = useState<string>('7');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtendRentalResult | null>(null);

  async function handleConfirm() {
    const days = parseInt(additionalDays, 10);
    if (!days || days < 1) {
      setError('Please enter at least 1 additional day');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const extendResult = await extendRental(rentalId, {
        additionalDays: days,
        paymentMethod: { type: 'CREDIT_CARD' },
      });
      setResult(extendResult);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to extend rental';
      setError(msg);
      setSubmitting(false);
    }
  }

  function handleDone() {
    if (result) {
      onSuccess(result);
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting && !result) {
          onClose();
        }
      }}
    >
      {/* Dialog card */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900">Extend Rental</h2>

        {!result ? (
          <>
            <p className="mt-1 text-sm text-gray-500">
              Enter the number of additional days to extend this rental.
            </p>

            {error && (
              <div className="mt-4 rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="mt-4">
              <label
                htmlFor="additionalDays"
                className="block text-sm font-medium text-gray-700"
              >
                Additional Days <span className="text-red-500">*</span>
              </label>
              <input
                id="additionalDays"
                type="number"
                min="1"
                step="1"
                value={additionalDays}
                onChange={(e) => {
                  setAdditionalDays(e.target.value);
                  setError(null);
                }}
                disabled={submitting}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                placeholder="7"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60"
              >
                {submitting && (
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
                {submitting ? 'Processing…' : 'Confirm Extension'}
              </button>
            </div>
          </>
        ) : (
          /* Success state */
          <>
            <div className="mt-4 rounded-md bg-green-50 p-4">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-green-400 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Rental extended successfully</h3>
                </div>
              </div>
            </div>

            <dl className="mt-4 divide-y divide-gray-100 text-sm">
              <div className="flex justify-between py-2">
                <dt className="text-gray-500">New End Date</dt>
                <dd className="font-medium text-gray-900">{formatDate(result.newEndDate)}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-gray-500">Additional Cost</dt>
                <dd className="font-medium text-gray-900">{formatCurrency(result.additionalCost)}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-gray-500">Payment Status</dt>
                <dd className="font-medium text-gray-900">{result.paymentStatus}</dd>
              </div>
            </dl>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleDone}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
