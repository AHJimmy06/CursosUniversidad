import { lazy } from 'react';
import { Navigate, createBrowserRouter, Outlet } from "react-router-dom";
import Loadable from 'src/layouts/full/shared/loadable/Loadable';
import ProtectedRoute from './ProtectedRoute';
import { useUser } from '../contexts/UserContext';

const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));
const Form = Loadable(lazy(() => import("../views/forms/Form")));
const CreateEvent = Loadable(lazy(() => import("../views/Eventos/CreateEvent")));
const EditEvent = Loadable(lazy(() => import("../views/Eventos/EditEvent")));
const ListEvents = Loadable(lazy(() => import("../views/Eventos/ListEvents")));
const UserManagement = Loadable(lazy(() => import("../views/Usuarios/UserManagement")));
const CreateUserPage = Loadable(lazy(() => import("../views/Usuarios/CreateUserPage")));
const Catalogo = Loadable(lazy(() => import('../views/catalogo/Catalogo')));
const EventoDetalle = Loadable(lazy(() => import('../views/eventoDetalle/EventoDetalle')));
const InscripcionWizard = Loadable(lazy(() => import('../views/Matricula/InscripcionWizard')));
const ValidacionMatriculas = Loadable(lazy(() => import('../views/Matricula/ValidacionMatriculas')));
const ValidarCarreras = Loadable(lazy(() => import('../views/admin/ValidarCarreras')));
const Auditoria = Loadable(lazy(() => import('../views/admin/Auditoria')));
const ErrorReport = Loadable(lazy(() => import('../views/ErrorReport/ErrorReport')));

const Dashboard = Loadable(lazy(() => import('../views/dashboards/Dashboard')));
const MiPerfil = Loadable(lazy(() => import('../views/perfil/MiPerfil')));

const Login = Loadable(lazy(() => import('../views/auth/login/Login')));
const Register = Loadable(lazy(() => import('../views/auth/register/Register')));
const Error = Loadable(lazy(() => import('../views/auth/error/Error')));
const ConfiguracionPage = Loadable(lazy(() => import('../views/Apariencia/configuracion')));
const GestionEstudiantes = Loadable(lazy(() => import('../views/docente/GestionEstudiantes')));
const DocenteEventos = Loadable(lazy(() => import('../views/docente/DocenteEventos')));
const ResponsableEventos = Loadable(lazy(() => import('../views/responsable/ResponsableEventos')));
const ListarSolicitudesCambio = Loadable(lazy(() => import('../views/cdc/ListarSolicitudesCambio')));
const DetalleSolicitudCambio = Loadable(lazy(() => import('../views/cdc/DetalleSolicitudCambio')));
const ApproveInscriptions = Loadable(lazy(() => import('../views/responsable/ApproveInscriptions')));
const ApproveDocuments = Loadable(lazy(() => import('../views/responsable/ApproveDocuments')));

const MisEventos = Loadable(lazy(() => import('../views/estudiante/MisEventos')));
const LandingPage = Loadable(lazy(() => import('../views/landing/LandingPage')));
const AboutUsPage = Loadable(lazy(() => import('../views/landing/info/AboutUsPage')));
const ContactPage = Loadable(lazy(() => import('../views/landing/info/ContactPage')));
const PrivacyPolicyPage = Loadable(lazy(() => import('../views/landing/info/PrivacyPolicyPage')));
const TermsAndConditionsPage = Loadable(lazy(() => import('../views/landing/info/TermsAndConditionsPage')));

const AuthRoutes = () => {
  const { user, profile, loading, isLoggingIn } = useUser();
  if (loading) return null;

  if (user && !isLoggingIn) {
    if (profile && profile.rol !== 'administrador') {
      return <Navigate to="/catalogo" />;
    }
    return <Navigate to="/" />;
  }

  return <Outlet />;
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
              { path: '/catalogo', exact: true, element: <Catalogo /> },
              { path: '/evento/:id', exact: true, element: <EventoDetalle /> },
              { path: '/evento/:id/inscripcion', exact: true, element: <InscripcionWizard /> },
              { path: '/responsable/solicitudes/:cursoId', exact: true, element: <ValidacionMatriculas /> },
              { path: '/ui/form', exact: true, element: <Form/> },
              { path: '/eventos/crear', exact: true, element: <CreateEvent/> },
              { path: '/eventos/editar/:id', exact: true, element: <EditEvent/> },
              { path: '/eventos/listar', exact: true, element: <ListEvents/> },
              { path: '/usuarios/listar', exact: true, element: <UserManagement/> },
              { path: '/usuarios/crear', exact: true, element: <CreateUserPage/> },
              { path: '/admin/validar-carreras', exact: true, element: <ValidarCarreras /> },
              { path: '/admin/auditoria', exact: true, element: <Auditoria /> },
              { path: 'perfil', element: <MiPerfil /> },
              { path: '/configuracion', exact: true, element: <ConfiguracionPage /> },
              { path: '/docente/eventos', exact: true, element: <DocenteEventos /> },
              { path: '/docente/gestion-estudiantes/:cursoId', exact: true, element: <GestionEstudiantes /> },
              { path: '/report-error', exact: true, element: <ErrorReport /> },
              { path: '/responsable/eventos', exact: true, element: <ResponsableEventos /> },
              { path: '/estudiante/mis-eventos', exact: true, element: <MisEventos /> },
              { path: '/cdc/solicitudes', exact: true, element: <ListarSolicitudesCambio /> },
              { path: '/cdc/solicitud/:id', exact: true, element: <DetalleSolicitudCambio /> },
              { path: '/responsable/aprobar-inscripciones', exact: true, element: <ApproveInscriptions /> },
              { path: '/responsable/aprobar-documentos/:eventoId', exact: true, element: <ApproveDocuments /> },
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
        path: '/landing',
        element: <BlankLayout />,
        children: [
          { path: '', element: <LandingPage /> },
          { path: 'about', element: <AboutUsPage /> },
          { path: 'contact', element: <ContactPage /> },
          { path: 'privacy-policy', element: <PrivacyPolicyPage /> },
          { path: 'terms-and-conditions', element: <TermsAndConditionsPage /> },
        ]
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