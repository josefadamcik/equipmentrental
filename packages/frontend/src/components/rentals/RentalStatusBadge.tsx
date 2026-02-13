/**
 * Badge component for rental status display.
 */

interface RentalStatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: 'Active',
    className: 'bg-green-100 text-green-800',
  },
  RESERVED: {
    label: 'Reserved',
    className: 'bg-blue-100 text-blue-800',
  },
  OVERDUE: {
    label: 'Overdue',
    className: 'bg-red-100 text-red-800',
  },
  RETURNED: {
    label: 'Returned',
    className: 'bg-gray-100 text-gray-700',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-gray-100 text-gray-400',
  },
};

export default function RentalStatusBadge({ status }: RentalStatusBadgeProps) {
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
