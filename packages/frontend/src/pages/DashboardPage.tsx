/**
 * DashboardPage - Summary overview of the Equipment Rental System.
 *
 * Layout:
 *   1. Hero heading
 *   2. 4-column StatCard grid (available equipment, total members, overdue rentals, utilisation)
 *   3. Equipment availability chart
 *   4. Recent overdue rentals list
 */

import { useApi } from '../hooks/useApi';
import { getAvailableEquipment } from '../api/equipment';
import { getMembers } from '../api/members';
import { getOverdueRentals } from '../api/rentals';
import StatCard from '../components/dashboard/StatCard';
import RecentActivityList from '../components/dashboard/RecentActivityList';
import EquipmentAvailabilityChart from '../components/dashboard/EquipmentAvailabilityChart';

// ---------------------------------------------------------------------------
// Small icon components (inline SVG, no icon library dependency)
// ---------------------------------------------------------------------------

function EquipmentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
  );
}

function MembersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

function OverdueIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  );
}

function UtilizationIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const {
    data: availableEquipment,
    loading: loadingEquipment,
  } = useApi(() => getAvailableEquipment(), []);

  const {
    data: members,
    loading: loadingMembers,
  } = useApi(() => getMembers(), []);

  const {
    data: overdueRentals,
    loading: loadingOverdue,
  } = useApi(() => getOverdueRentals(), []);

  // Utilisation: overdue / (available + overdue) * 100, shown as a percentage.
  const availableCount = availableEquipment?.length ?? 0;
  const overdueCount = overdueRentals?.length ?? 0;
  const total = availableCount + overdueCount;
  const utilisation = total > 0 ? Math.round((overdueCount / total) * 100) : 0;

  return (
    <div>
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of the equipment rental system
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Stat cards                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Available Equipment"
          value={loadingEquipment ? '…' : availableCount}
          subtitle="Currently available to rent"
          icon={<EquipmentIcon />}
          color="indigo"
          to="/equipment"
          loading={loadingEquipment}
        />

        <StatCard
          title="Total Members"
          value={loadingMembers ? '…' : (members?.length ?? 0)}
          subtitle="Registered members"
          icon={<MembersIcon />}
          color="green"
          to="/members"
          loading={loadingMembers}
        />

        <StatCard
          title="Overdue Rentals"
          value={loadingOverdue ? '…' : overdueCount}
          subtitle="Require immediate attention"
          icon={<OverdueIcon />}
          color="red"
          to="/rentals"
          loading={loadingOverdue}
        />

        <StatCard
          title="Equipment Utilisation"
          value={
            loadingEquipment || loadingOverdue
              ? '…'
              : `${utilisation}%`
          }
          subtitle={total > 0 ? `${overdueCount} of ${total} units out` : 'No data yet'}
          icon={<UtilizationIcon />}
          color="amber"
          loading={loadingEquipment || loadingOverdue}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Equipment availability chart                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Equipment Availability
        </h2>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <EquipmentAvailabilityChart />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Recent overdue rentals                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Overdue Rentals
        </h2>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <RecentActivityList />
        </div>
      </div>
    </div>
  );
}
