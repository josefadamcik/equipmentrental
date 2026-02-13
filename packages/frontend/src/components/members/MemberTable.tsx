/**
 * Reusable table component for displaying a list of members.
 */

import { useNavigate } from 'react-router-dom';
import type { MemberResponse } from '../../types/api';
import { TierBadge, ActiveStatusBadge } from './TierBadge';

interface MemberTableProps {
  members: MemberResponse[];
}

export default function MemberTable({ members }: MemberTableProps) {
  const navigate = useNavigate();

  if (members.length === 0) {
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
            d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
          />
        </svg>
        <p className="mt-4 text-sm text-gray-500">No members found matching your criteria.</p>
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
                Email
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Tier
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Active Rentals
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
            {members.map((member) => (
              <tr
                key={member.memberId}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => navigate(`/members/${member.memberId}`)}
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="text-sm font-medium text-gray-900">{member.name}</span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {member.email}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <TierBadge tier={member.tier} />
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {member.activeRentalCount}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <ActiveStatusBadge isActive={member.isActive} />
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
        {members.map((member) => (
          <li
            key={member.memberId}
            className="cursor-pointer px-4 py-4 hover:bg-gray-50 transition-colors"
            onClick={() => navigate(`/members/${member.memberId}`)}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
              <TierBadge tier={member.tier} />
            </div>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
              <span className="truncate">{member.email}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <ActiveStatusBadge isActive={member.isActive} />
              {member.activeRentalCount > 0 && (
                <span className="text-xs text-gray-500">
                  {member.activeRentalCount} active rental{member.activeRentalCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
