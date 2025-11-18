import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import Spinner from '../views/spinner/Spinner';

interface ProtectedRouteProps {
  redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ redirectPath = '/auth/login' }) => {
  const { user, profile, loading } = useUser();
  const location = useLocation();

  if (loading) {
    return <Spinner />;
  }

  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }

  if (location.pathname === '/' && profile && profile.rol !== 'administrador') {
    return <Navigate to="/catalogo" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;