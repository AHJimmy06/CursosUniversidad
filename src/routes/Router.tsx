import { lazy } from 'react';
import { Navigate, createBrowserRouter, Outlet } from "react-router";
import Loadable from 'src/layouts/full/shared/loadable/Loadable';
import ProtectedRoute from './ProtectedRoute';
import { useUser } from '../contexts/UserContext';

const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));

const Dashboard = Loadable(lazy(() => import('../views/dashboards/Dashboard')));
const MiPerfil = Loadable(lazy(() => import('../views/perfil/MiPerfil')));
const UserManagement = Loadable(lazy(() => import('../views/admin/UserManagement')));
const EventManagement = Loadable(lazy(() => import('../views/admin/EventManagement')));

const Login = Loadable(lazy(() => import('../views/auth/login/Login')));
const Register = Loadable(lazy(() => import('../views/auth/register/Register')));
const Error = Loadable(lazy(() => import('../views/auth/error/Error')));


const AuthRoutes = () => {
  const { user, loading, isLoggingIn } = useUser();
  if (loading) return null;
  return user && !isLoggingIn ? <Navigate to="/" /> : <Outlet />;
};

const AdminRoute = () => {
  const { profile, loading } = useUser();
  if (loading) return null;
  return profile?.rol === 'administrador' ? <Outlet /> : <Navigate to="/" />;
};

const Router = [
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <FullLayout />,
        children: [
          { path: '/', element: <Dashboard /> },
          { path: 'perfil', element: <MiPerfil /> },
        ],
      },
      {
        path: '/admin',
        element: <AdminRoute />,
        children: [
          {
            path: '',
            element: <FullLayout />,
            children: [
              { path: 'usermanagement', element: <UserManagement /> },
              { path: 'events', element: <EventManagement /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/auth',
    element: <AuthRoutes />,
    children: [
      {
        path: '',
        element: <BlankLayout />,
        children: [
          { path: 'login', element: <Login /> },
          { path: 'register', element: <Register /> },
          { path: '404', element: <Error /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/auth/404" />,
  },
];

const AppRouter = () => {
    return createBrowserRouter(Router);
}

const router = AppRouter();

export default router;