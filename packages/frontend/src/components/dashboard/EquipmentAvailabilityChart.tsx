/**
 * EquipmentAvailabilityChart - Visual breakdown of equipment availability.
 *
 * Renders a horizontal stacked bar (green = available, red = rented) alongside
 * numeric labels. No third-party chart library is used; everything is plain
 * Tailwind CSS.
 */

import { useApi } from '../../hooks/useApi';
import { getAvailableEquipment } from '../../api/equipment';
import { getOverdueRentals } from '../../api/rentals';

export default function EquipmentAvailabilityChart() {
  const { data: available, loading: loadingEquip, error: errorEquip } = useApi(
    () => getAvailableEquipment(),
    [],
  );

  const { data: overdue, loading: loadingOverdue, error: errorOverdue } = useApi(
    () => getOverdueRentals(),
    [],
  );

  const loading = loadingEquip || loadingOverdue;
  const error = errorEquip ?? errorOverdue;

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-6 rounded bg-gray-200 animate-pulse" />
        <div className="h-8 rounded bg-gray-200 animate-pulse" />
        <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        Failed to load availability data: {error.error.message}
      </p>
    );
  }

  const availableCount = available?.length ?? 0;
  const overdueCount = overdue?.length ?? 0;
  // "Rented" is approximated as overdue rentals visible via the API; we show
  // it as a separate segment.  Total is available + overdue (as a floor).
  const total = availableCount + overdueCount;

  if (total === 0) {
    return (
      <p className="text-sm text-gray-500">No equipment data available.</p>
    );
  }

  const availablePct = Math.round((availableCount / total) * 100);
  const rentedPct = 100 - availablePct;

  return (
    <div className="space-y-4">
      {/* Stacked bar */}
      <div className="flex h-6 w-full rounded-full overflow-hidden" role="img" aria-label="Equipment availability breakdown">
        {availablePct > 0 && (
          <div
            className="bg-green-500 transition-all duration-500"
            style={{ width: `${availablePct}%` }}
            title={`Available: ${availableCount}`}
          />
        )}
        {rentedPct > 0 && (
          <div
            className="bg-red-400 transition-all duration-500"
            style={{ width: `${rentedPct}%` }}
            title={`Overdue / rented: ${overdueCount}`}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm bg-green-500" />
          <span className="text-gray-700">
            Available —{' '}
            <span className="font-semibold text-gray-900">{availableCount}</span>
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm bg-red-400" />
          <span className="text-gray-700">
            Overdue —{' '}
            <span className="font-semibold text-gray-900">{overdueCount}</span>
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="text-gray-500">
            Total tracked —{' '}
            <span className="font-semibold text-gray-900">{total}</span>
          </span>
        </span>
      </div>
    </div>
  );
}
