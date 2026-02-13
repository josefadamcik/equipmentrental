/**
 * Reusable table component for displaying a list of reservations.
 */

import { useNavigate } from 'react-router-dom';
import type { ReservationResponse } from '../../types/api';
import ReservationStatusBadge from './ReservationStatusBadge';

interface ReservationTableProps {
  reservations: ReservationResponse[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function truncateId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}\u2026` : id;
}

export default function ReservationTable({ reservations }: ReservationTableProps) {
  const navigate = useNavigate();

  if (reservations.length === 0) {
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
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"
          />
        </svg>
        <p className="mt-4 text-sm text-gray-500">No reservations found.</p>
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
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">View</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {reservations.map((reservation) => (
              <tr
                key={reservation.reservationId}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => navigate(`/reservations/${reservation.reservationId}`)}
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className="text-sm font-mono text-gray-900"
                    title={reservation.equipmentId}
                  >
                    {truncateId(reservation.equipmentId)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className="text-sm font-mono text-gray-500"
                    title={reservation.memberId}
                  >
                    {truncateId(reservation.memberId)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {formatDate(reservation.startDate)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {formatDate(reservation.endDate)}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <ReservationStatusBadge status={reservation.status} />
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
        {reservations.map((reservation) => (
          <li
            key={reservation.reservationId}
            className="cursor-pointer px-4 py-4 hover:bg-gray-50 transition-colors"
            onClick={() => navigate(`/reservations/${reservation.reservationId}`)}
          >
            <div className="flex items-center justify-between">
              <p
                className="text-sm font-mono text-gray-900 truncate"
                title={reservation.equipmentId}
              >
                {truncateId(reservation.equipmentId)}
              </p>
              <ReservationStatusBadge status={reservation.status} />
            </div>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
              <span>{formatDate(reservation.startDate)}</span>
              <span>&middot;</span>
              <span>{formatDate(reservation.endDate)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
