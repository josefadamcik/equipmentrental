/**
 * Create Rental page.
 *
 * Form for creating a new rental:
 *   - Equipment selector (from available equipment)
 *   - Member selector (from active members)
 *   - Start date / End date
 *   - Payment method
 */

import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAvailableEquipment } from '../api/equipment';
import { getMembers } from '../api/members';
import { createRental } from '../api/rentals';
import { useApi } from '../hooks/useApi';
import type { CreateRentalResult } from '../types/api';

// Today's ISO date string for min-date validation
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

interface FormValues {
  equipmentId: string;
  memberId: string;
  startDate: string;
  endDate: string;
  paymentMethodType: string;
}

interface FormErrors {
  equipmentId?: string;
  memberId?: string;
  startDate?: string;
  endDate?: string;
  paymentMethodType?: string;
}

const PAYMENT_METHOD_OPTIONS = [
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'DEBIT_CARD', label: 'Debit Card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
];

const EMPTY_FORM: FormValues = {
  equipmentId: '',
  memberId: '',
  startDate: '',
  endDate: '',
  paymentMethodType: 'CREDIT_CARD',
};

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.equipmentId) {
    errors.equipmentId = 'Please select equipment';
  }
  if (!values.memberId) {
    errors.memberId = 'Please select a member';
  }
  if (!values.startDate) {
    errors.startDate = 'Start date is required';
  }
  if (!values.endDate) {
    errors.endDate = 'End date is required';
  } else if (values.startDate && values.endDate <= values.startDate) {
    errors.endDate = 'End date must be after start date';
  }
  if (!values.paymentMethodType) {
    errors.paymentMethodType = 'Payment method is required';
  }

  return errors;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function CreateRentalPage() {
  const navigate = useNavigate();

  const { data: equipmentList, loading: equipmentLoading, error: equipmentError } = useApi(
    () => getAvailableEquipment(),
    [],
  );
  const { data: membersList, loading: membersLoading, error: membersError } = useApi(
    () => getMembers(),
    [],
  );

  const activeMembers = useMemo(
    () => (membersList ? membersList.filter((m) => m.isActive) : []),
    [membersList],
  );

  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreateRentalResult | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const fieldErrors = validate(values);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const created = await createRental({
        equipmentId: values.equipmentId,
        memberId: values.memberId,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        paymentMethod: { type: values.paymentMethodType },
      });
      setResult(created);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setSubmitError(msg);
      setSubmitting(false);
    }
  }

  const dataLoading = equipmentLoading || membersLoading;
  const dataError = equipmentError ?? membersError;

  // Show loading state while fetching selectors
  if (dataLoading) {
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
        <span className="ml-3 text-sm text-gray-500">Loading…</span>
      </div>
    );
  }

  if (dataError) {
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
          <p className="text-sm font-medium text-red-800">{dataError.error.message}</p>
        </div>
      </div>
    );
  }

  // Success state: show result and navigate
  if (result) {
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
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6 max-w-lg">
          <div className="rounded-md bg-green-50 p-4">
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
                <h3 className="text-sm font-medium text-green-800">Rental created successfully</h3>
              </div>
            </div>
          </div>

          <dl className="mt-4 divide-y divide-gray-100 text-sm">
            <div className="flex justify-between py-2">
              <dt className="text-gray-500">Rental ID</dt>
              <dd className="font-mono text-gray-900">{result.rentalId}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-gray-500">Total Cost</dt>
              <dd className="font-medium text-gray-900">{formatCurrency(result.totalCost)}</dd>
            </div>
            {result.discountApplied > 0 && (
              <div className="flex justify-between py-2">
                <dt className="text-gray-500">Discount Applied</dt>
                <dd className="font-medium text-green-700">{formatCurrency(result.discountApplied)}</dd>
              </div>
            )}
            <div className="flex justify-between py-2">
              <dt className="text-gray-500">Payment Status</dt>
              <dd className="font-medium text-gray-900">{result.paymentStatus}</dd>
            </div>
          </dl>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => navigate(`/rentals/${result.rentalId}`)}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              View Rental
            </button>
            <Link
              to="/rentals"
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Back to Rentals
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
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
      <div className="mt-4">
        <h1 className="text-2xl font-bold text-gray-900">Create Rental</h1>
        <p className="mt-1 text-sm text-gray-500">Set up a new equipment rental for a member.</p>
      </div>

      {/* Form card */}
      <div className="mt-6 bg-white rounded-lg shadow-sm p-6 max-w-2xl">
        {submitError && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
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
              <p className="ml-3 text-sm text-red-700">{submitError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Equipment selector */}
            <div className="sm:col-span-2">
              <label htmlFor="equipmentId" className="block text-sm font-medium text-gray-700">
                Equipment <span className="text-red-500">*</span>
              </label>
              <select
                id="equipmentId"
                name="equipmentId"
                value={values.equipmentId}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                  errors.equipmentId
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              >
                <option value="">-- Select equipment --</option>
                {(equipmentList ?? []).map((eq) => (
                  <option key={eq.equipmentId} value={eq.equipmentId}>
                    {eq.name} ({eq.category}) — ${eq.dailyRate}/day
                  </option>
                ))}
              </select>
              {errors.equipmentId && (
                <p className="mt-1 text-xs text-red-600">{errors.equipmentId}</p>
              )}
              {(equipmentList ?? []).length === 0 && (
                <p className="mt-1 text-xs text-gray-500">No available equipment at this time.</p>
              )}
            </div>

            {/* Member selector */}
            <div className="sm:col-span-2">
              <label htmlFor="memberId" className="block text-sm font-medium text-gray-700">
                Member <span className="text-red-500">*</span>
              </label>
              <select
                id="memberId"
                name="memberId"
                value={values.memberId}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                  errors.memberId
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              >
                <option value="">-- Select member --</option>
                {activeMembers.map((m) => (
                  <option key={m.memberId} value={m.memberId}>
                    {m.name} ({m.email}) — {m.tier}
                  </option>
                ))}
              </select>
              {errors.memberId && (
                <p className="mt-1 text-xs text-red-600">{errors.memberId}</p>
              )}
              {activeMembers.length === 0 && (
                <p className="mt-1 text-xs text-gray-500">No active members available.</p>
              )}
            </div>

            {/* Start date */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                min={todayISO()}
                value={values.startDate}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                  errors.startDate
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {errors.startDate && (
                <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>
              )}
            </div>

            {/* End date */}
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                min={values.startDate || todayISO()}
                value={values.endDate}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                  errors.endDate
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {errors.endDate && (
                <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>
              )}
            </div>

            {/* Payment method */}
            <div>
              <label htmlFor="paymentMethodType" className="block text-sm font-medium text-gray-700">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                id="paymentMethodType"
                name="paymentMethodType"
                value={values.paymentMethodType}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                  errors.paymentMethodType
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              >
                {PAYMENT_METHOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.paymentMethodType && (
                <p className="mt-1 text-xs text-red-600">{errors.paymentMethodType}</p>
              )}
            </div>
          </div>

          {/* Form actions */}
          <div className="mt-8 flex items-center justify-end gap-3">
            <Link
              to="/rentals"
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
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
              {submitting ? 'Creating…' : 'Create Rental'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
