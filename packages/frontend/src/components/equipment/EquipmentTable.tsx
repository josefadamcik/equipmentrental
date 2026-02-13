/**
 * Reusable table component for displaying a list of equipment.
 */

import { useNavigate } from 'react-router-dom';
import type { EquipmentResponse } from '../../types/api';
import { ConditionBadge } from './EquipmentStatusBadge';

interface EquipmentTableProps {
  equipment: EquipmentResponse[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function EquipmentTable({ equipment }: EquipmentTableProps) {
  const navigate = useNavigate();

  if (equipment.length === 0) {
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
            d="M20 7H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 3H8a1 1 0 0 0-1 1v3h10V4a1 1 0 0 0-1-1z"
          />
        </svg>
        <p className="mt-4 text-sm text-gray-500">No equipment found matching your criteria.</p>
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
                Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Category
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Daily Rate
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Condition
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
            {equipment.map((item) => (
              <tr
                key={item.equipmentId}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => navigate(`/equipment/${item.equipmentId}`)}
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {item.category}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {formatCurrency(item.dailyRate)}
                  <span className="text-gray-500">/day</span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <ConditionBadge condition={item.condition} />
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {item.isAvailable === false ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Rented
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Available
                    </span>
                  )}
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
        {equipment.map((item) => (
          <li
            key={item.equipmentId}
            className="cursor-pointer px-4 py-4 hover:bg-gray-50 transition-colors"
            onClick={() => navigate(`/equipment/${item.equipmentId}`)}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
              <ConditionBadge condition={item.condition} />
            </div>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
              <span>{item.category}</span>
              <span>&middot;</span>
              <span>{formatCurrency(item.dailyRate)}/day</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
