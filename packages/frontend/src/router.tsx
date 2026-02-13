import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import DashboardPage from './pages/DashboardPage';
import EquipmentListPage from './pages/EquipmentListPage';
import MembersListPage from './pages/MembersListPage';
import RentalsPage from './pages/RentalsPage';
import ReservationsPage from './pages/ReservationsPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'equipment', element: <EquipmentListPage /> },
      { path: 'equipment/new', element: <div className="text-gray-500">New Equipment — coming soon</div> },
      { path: 'equipment/:id', element: <div className="text-gray-500">Equipment Detail — coming soon</div> },
      { path: 'members', element: <MembersListPage /> },
      { path: 'members/new', element: <div className="text-gray-500">New Member — coming soon</div> },
      { path: 'members/:id', element: <div className="text-gray-500">Member Detail — coming soon</div> },
      { path: 'rentals', element: <RentalsPage /> },
      { path: 'rentals/new', element: <div className="text-gray-500">New Rental — coming soon</div> },
      { path: 'rentals/:id', element: <div className="text-gray-500">Rental Detail — coming soon</div> },
      { path: 'reservations', element: <ReservationsPage /> },
      { path: 'reservations/new', element: <div className="text-gray-500">New Reservation — coming soon</div> },
      { path: 'reservations/:id', element: <div className="text-gray-500">Reservation Detail — coming soon</div> },
    ],
  },
]);

export default router;
