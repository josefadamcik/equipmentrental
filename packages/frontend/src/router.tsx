import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import DashboardPage from './pages/DashboardPage';
import EquipmentListPage from './pages/EquipmentListPage';
import EquipmentDetailPage from './pages/EquipmentDetailPage';
import EquipmentFormPage from './pages/EquipmentFormPage';
import MembersListPage from './pages/MembersListPage';
import MemberDetailPage from './pages/MemberDetailPage';
import MemberFormPage from './pages/MemberFormPage';
import RentalsPage from './pages/RentalsPage';
import CreateRentalPage from './pages/CreateRentalPage';
import RentalDetailPage from './pages/RentalDetailPage';
import ReservationsPage from './pages/ReservationsPage';
import CreateReservationPage from './pages/CreateReservationPage';
import ReservationDetailPage from './pages/ReservationDetailPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },

      // Equipment routes
      { path: 'equipment', element: <EquipmentListPage /> },
      { path: 'equipment/new', element: <EquipmentFormPage /> },
      { path: 'equipment/:id', element: <EquipmentDetailPage /> },
      { path: 'equipment/:id/edit', element: <EquipmentFormPage /> },

      // Member routes
      { path: 'members', element: <MembersListPage /> },
      { path: 'members/new', element: <MemberFormPage /> },
      { path: 'members/:id', element: <MemberDetailPage /> },
      { path: 'members/:id/edit', element: <MemberFormPage /> },

      // Rental routes
      { path: 'rentals', element: <RentalsPage /> },
      { path: 'rentals/new', element: <CreateRentalPage /> },
      { path: 'rentals/:id', element: <RentalDetailPage /> },

      // Reservation routes
      { path: 'reservations', element: <ReservationsPage /> },
      { path: 'reservations/new', element: <CreateReservationPage /> },
      { path: 'reservations/:id', element: <ReservationDetailPage /> },
    ],
  },
]);

export default router;
