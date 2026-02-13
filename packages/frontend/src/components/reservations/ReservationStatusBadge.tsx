/**
 * Badge component for reservation status display.
 */

interface ReservationStatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800',
  },
  CONFIRMED: {
    label: 'Confirmed',
    className: 'bg-blue-100 text-blue-800',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-gray-100 text-gray-500',
  },
  FULFILLED: {
    label: 'Fulfilled',
    className: 'bg-green-100 text-green-800',
  },
  EXPIRED: {
    label: 'Expired',
    className: 'bg-red-100 text-red-700',
  },
};

export default function ReservationStatusBadge({ status }: ReservationStatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-800',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
