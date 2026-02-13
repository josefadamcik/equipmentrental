/**
 * Equipment detail page.
 * Shows all information about a single piece of equipment.
 */

import { Link, useParams } from 'react-router-dom';
import { getEquipment } from '../api/equipment';
import { useApi } from '../hooks/useApi';
import { ConditionBadge, AvailabilityBadge } from '../components/equipment/EquipmentStatusBadge';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: equipment, loading, error } = useApi(
    () => getEquipment(id ?? ''),
    [id],
  );

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
        <span className="ml-3 text-sm text-gray-500">Loading equipment…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Link
          to="/equipment"
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
          Back to list
        </Link>
        <div className="mt-4 rounded-lg bg-red-50 p-4 shadow">
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
              <h3 className="text-sm font-medium text-red-800">Failed to load equipment</h3>
              <p className="mt-1 text-sm text-red-700">{error.error.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return null;
  }

  return (
    <div>
      {/* Breadcrumb / back link */}
      <Link
        to="/equipment"
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
        Back to list
      </Link>

      {/* Page header */}
      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{equipment.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{equipment.category}</p>
        </div>
        <Link
          to={`/equipment/${equipment.equipmentId}/edit`}
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

      {/* Details card */}
      <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-sm font-medium text-gray-500">Daily Rate</dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900">
              {formatCurrency(equipment.dailyRate)}
              <span className="text-sm font-normal text-gray-500">/day</span>
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Condition</dt>
            <dd className="mt-1">
              <ConditionBadge condition={equipment.condition} />
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Availability</dt>
            <dd className="mt-1">
              <AvailabilityBadge isAvailable={equipment.isAvailable ?? true} />
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Equipment ID</dt>
            <dd className="mt-1 text-sm font-mono text-gray-700 break-all">
              {equipment.equipmentId}
            </dd>
          </div>

          {equipment.currentRentalId && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Current Rental ID</dt>
              <dd className="mt-1 text-sm font-mono text-gray-700 break-all">
                {equipment.currentRentalId}
              </dd>
            </div>
          )}
        </dl>

        {equipment.description && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <dt className="text-sm font-medium text-gray-500">Description</dt>
            <dd className="mt-2 text-sm text-gray-700 leading-relaxed">
              {equipment.description}
            </dd>
          </div>
        )}
      </div>
    </div>
  );
}
