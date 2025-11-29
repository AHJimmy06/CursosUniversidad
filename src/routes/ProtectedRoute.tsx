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

  // 1. Si está cargando sesión inicial, spinner.
  if (loading) {
    return <Spinner />;
  }

  // 2. Si no hay usuario, login.
  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }

  // 3. MEJORA: Evitar "Flash" en la ruta raíz.
  // Si estamos en '/', ya tenemos usuario pero el perfil aún no llega (es null),
  // mostramos spinner un momento más para saber si debemos redirigir o no.
  if (location.pathname === '/' && !profile) {
     return <Spinner />;
  }

  // 4. Lógica de redirección por rol
  if (location.pathname === '/' && profile && profile.rol !== 'administrador') {
    return <Navigate to="/catalogo" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;