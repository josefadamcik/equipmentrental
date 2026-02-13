/**
 * Dialog component for returning a rental.
 * Shows a condition dropdown and submits the return request.
 */

import { useState } from 'react';
import { returnRental } from '../../api/rentals';
import { EquipmentCondition } from '../../types/api';
import type { ReturnRentalResult } from '../../types/api';

interface ReturnRentalDialogProps {
  rentalId: string;
  onClose: () => void;
  onSuccess: (result: ReturnRentalResult) => void;
}

const CONDITION_OPTIONS = [
  { value: EquipmentCondition.EXCELLENT, label: 'Excellent' },
  { value: EquipmentCondition.GOOD, label: 'Good' },
  { value: EquipmentCondition.FAIR, label: 'Fair' },
  { value: EquipmentCondition.POOR, label: 'Poor' },
  { value: EquipmentCondition.DAMAGED, label: 'Damaged' },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function ReturnRentalDialog({
  rentalId,
  onClose,
  onSuccess,
}: ReturnRentalDialogProps) {
  const [condition, setCondition] = useState<string>(EquipmentCondition.GOOD);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnRentalResult | null>(null);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);

    try {
      const returnResult = await returnRental(rentalId, {
        conditionAtReturn: condition,
        paymentMethod: { type: 'CREDIT_CARD' },
      });
      setResult(returnResult);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to return rental';
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
        <h2 className="text-lg font-semibold text-gray-900">Return Rental</h2>

        {!result ? (
          <>
            <p className="mt-1 text-sm text-gray-500">
              Select the condition of the equipment at return.
            </p>

            {error && (
              <div className="mt-4 rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="mt-4">
              <label
                htmlFor="returnCondition"
                className="block text-sm font-medium text-gray-700"
              >
                Condition at Return <span className="text-red-500">*</span>
              </label>
              <select
                id="returnCondition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                disabled={submitting}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
              >
                {CONDITION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
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
                {submitting ? 'Processing…' : 'Confirm Return'}
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
                  <h3 className="text-sm font-medium text-green-800">Rental returned successfully</h3>
                </div>
              </div>
            </div>

            <dl className="mt-4 divide-y divide-gray-100 text-sm">
              <div className="flex justify-between py-2">
                <dt className="text-gray-500">Total Cost</dt>
                <dd className="font-medium text-gray-900">{formatCurrency(result.totalCost)}</dd>
              </div>
              {result.lateFee > 0 && (
                <div className="flex justify-between py-2">
                  <dt className="text-gray-500">Late Fee</dt>
                  <dd className="font-medium text-red-600">{formatCurrency(result.lateFee)}</dd>
                </div>
              )}
              {result.damageFee > 0 && (
                <div className="flex justify-between py-2">
                  <dt className="text-gray-500">Damage Fee</dt>
                  <dd className="font-medium text-red-600">{formatCurrency(result.damageFee)}</dd>
                </div>
              )}
              {result.refundAmount !== undefined && result.refundAmount > 0 && (
                <div className="flex justify-between py-2">
                  <dt className="text-gray-500">Refund Amount</dt>
                  <dd className="font-medium text-green-700">{formatCurrency(result.refundAmount)}</dd>
                </div>
              )}
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
