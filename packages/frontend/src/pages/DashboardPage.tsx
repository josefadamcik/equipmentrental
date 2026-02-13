export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Overview of the equipment rental system</p>
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active Rentals', value: '—' },
          { label: 'Available Equipment', value: '—' },
          { label: 'Overdue Rentals', value: '—' },
          { label: 'Total Members', value: '—' },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white overflow-hidden rounded-lg shadow px-5 py-6"
          >
            <p className="text-sm font-medium text-gray-500 truncate">{card.label}</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
