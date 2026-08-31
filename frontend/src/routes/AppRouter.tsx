import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import { useAuthStore } from '../app/store';
import MainLayout from '../layouts/MainLayout';
import LoginPage from '../features/auth/LoginPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import CustomerListPage from '../features/customers/CustomerListPage';
import CustomerDetailPage from '../features/customers/CustomerDetailPage';
import CustomerFormPage from '../features/customers/CustomerFormPage';
import TicketListPage from '../features/tickets/TicketListPage';
import TicketDetailPage from '../features/tickets/TicketDetailPage';
import AuditLogPage from '../features/admin/AuditLogPage';
import UserManagementPage from '../features/admin/UserManagementPage';
import { useEffect } from 'react';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'customers',
        children: [
          { index: true, element: <CustomerListPage /> },
          { path: 'new', element: <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><CustomerFormPage /></ProtectedRoute> },
          { path: ':id', element: <CustomerDetailPage /> },
          { path: ':id/edit', element: <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><CustomerFormPage /></ProtectedRoute> },
        ]
      },
      {
        path: 'tickets',
        children: [
          { index: true, element: <TicketListPage /> },
          { path: ':id', element: <TicketDetailPage /> },
        ]
      },
      {
        path: 'admin/audit-logs',
        element: <ProtectedRoute allowedRoles={['ADMIN']}><AuditLogPage /></ProtectedRoute>,
      },
      {
        path: 'admin/users',
        element: <ProtectedRoute allowedRoles={['ADMIN']}><UserManagementPage /></ProtectedRoute>,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

const AppRouter = () => {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <RouterProvider router={router} />;
};

export default AppRouter;
