/**
 * Reusable table component for displaying a list of rentals.
 */

import { useNavigate } from 'react-router-dom';
import type { RentalResponse } from '../../types/api';
import RentalStatusBadge from './RentalStatusBadge';

interface RentalTableProps {
  rentals: RentalResponse[];
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

function truncateId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

export default function RentalTable({ rentals }: RentalTableProps) {
  const navigate = useNavigate();

  if (rentals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow px-6 py-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-300"
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
        <p className="mt-4 text-sm text-gray-500">No rentals found.</p>
      </div>
    );
  }

  return (
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
                Equipment ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Member ID
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
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">View</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {rentals.map((rental) => (
              <tr
                key={rental.rentalId}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => navigate(`/rentals/${rental.rentalId}`)}
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className="text-sm font-mono text-gray-900"
                    title={rental.equipmentId}
                  >
                    {truncateId(rental.equipmentId)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className="text-sm font-mono text-gray-500"
                    title={rental.memberId}
                  >
                    {truncateId(rental.memberId)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {formatDate(rental.startDate)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {formatDate(rental.endDate)}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <RentalStatusBadge status={rental.status} />
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {formatCurrency(rental.totalCost)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <span className="text-indigo-600 hover:text-indigo-900">View</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <ul className="divide-y divide-gray-200 sm:hidden">
        {rentals.map((rental) => (
          <li
            key={rental.rentalId}
            className="cursor-pointer px-4 py-4 hover:bg-gray-50 transition-colors"
            onClick={() => navigate(`/rentals/${rental.rentalId}`)}
          >
            <div className="flex items-center justify-between">
              <p
                className="text-sm font-mono text-gray-900 truncate"
                title={rental.equipmentId}
              >
                {truncateId(rental.equipmentId)}
              </p>
              <RentalStatusBadge status={rental.status} />
            </div>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
              <span>{formatDate(rental.startDate)}</span>
              <span>&middot;</span>
              <span>{formatDate(rental.endDate)}</span>
              <span>&middot;</span>
              <span>{formatCurrency(rental.totalCost)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
