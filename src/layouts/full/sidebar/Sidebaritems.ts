import { uniqueId } from "lodash";

export interface ChildItem {
  id?: number | string;
  name?: string;
  icon?: any;
  children?: ChildItem[];
  item?: any;
  url?: any;
  color?: string;
  isPro?: boolean;
  roles?: string[];
  description?: string; // Added for tooltips
}

export interface MenuItem {
  heading?: string;
  name?: string;
  icon?: any;
  id?: number;
  to?: string;
  items?: MenuItem[];
  children?: ChildItem[];
  url?: any;
  isPro?: boolean;
  roles?: string[];
  description?: string; // Added for tooltips
}

const SidebarContent: MenuItem[] = [
  {
    heading: "Navegación General",
    children: [
      {
        name: "Página Principal",
        icon: "solar:widget-add-line-duotone",
        id: uniqueId(),
        url: "/",
        isPro: false,
        roles: ['administrador'],
        description: "Accede al panel principal de administración y resumen del sistema.",
      },
      {
        name: "Catálogo de Cursos",
        icon: "solar:book-2-line-duotone",
        id: uniqueId(),
        url: "/catalogo",
        isPro: false,
        description: "Explora la oferta completa de cursos y eventos disponibles.",
      },
    ],
  },
  {
    heading: "Gestión en Información",
    roles: ['administrador'],
    children: [
      {
        name: "Eventos",
        icon: "solar:calendar-line-duotone",
        id: uniqueId(),
        url: "/eventos",
        isPro: false,
        roles: ['administrador'],
        description: "Administra y organiza los eventos académicos.",
        children: [
          {
            name: "Crear Evento",
            icon: "solar:document-add-line-duotone",
            id: uniqueId(),
            url: "/eventos/crear",
            isPro: false,
            description: "Crea un nuevo evento académico para el catálogo.",
          },
          {
            name: "Listar Eventos",
            icon: "solar:list-bold",
            id: uniqueId(),
            url: "/eventos/listar",
            isPro: false,
            roles: ['administrador'],
            description: "Visualiza y gestiona todos los eventos existentes.",
          }
        ]
      },
      {
        name: "Usuarios",
        icon: "solar:user-line-duotone",
        id: uniqueId(),
        url: "/usuarios",
        isPro: false,
        roles: ['administrador'],
        description: "Gestiona las cuentas y roles de los usuarios del sistema.",
        children: [
          {
            name: "Lista de Usuarios",
            icon: "solar:list-bold",
            id: uniqueId(),
            url: "/usuarios/listar",
            isPro: false,
            roles: ['administrador'],
            description: "Consulta y administra la lista de todos los usuarios registrados.",
          },
          {
            name: "Crear Usuario",
            icon: "solar:user-plus-line-duotone",
            id: uniqueId(),
            url: "/usuarios/crear",
            isPro: false,
            roles: ['administrador'],
            description: "Registra una nueva cuenta de usuario en el sistema.",
          }
        ]
      },
    ],
  },
  {
    heading: "Comité de Cambios (CDC)",
    roles: ['administrador', 'Gestor de Cambios', 'Miembro CAB', 'Líder Técnico'],
    description: "Accede a las funcionalidades del Comité de Cambios para la gestión de solicitudes.",
    children: [
      {
        name: "Solicitudes",
        icon: "solar:file-check-line-duotone",
        id: uniqueId(),
        url: "/cdc/solicitudes",
        isPro: false,
        roles: ['administrador', 'Gestor de Cambios', 'Miembro CAB', 'Líder Técnico'],
        description: "Revisa y gestiona las solicitudes de cambio pendientes.",
      },
    ],
  },
  {
    heading: "Roles",
    children: [
      {
        name: "Docente",
        icon: "solar:user-id-line-duotone",
        id: uniqueId(),
        url: "/docente/eventos",
        isPro: false,
        description: "Accede a los eventos asignados como docente y gestiona estudiantes.",
      },
      {
        name: "Responsable",
        icon: "solar:user-check-line-duotone",
        id: uniqueId(),
        url: "/responsable/eventos",
        isPro: false,
        description: "Gestiona eventos y aprueba inscripciones como responsable.",
      },
      {
        name: "Aprobar Inscripciones",
        icon: "solar:check-circle-line-duotone",
        id: uniqueId(),
        url: "/responsable/aprobar-inscripciones",
        isPro: false,
        roles: ['responsable'],
        description: "Revisa y aprueba las solicitudes de inscripción a eventos.",
      },
      {
        name: "Aprobar Documentos",
        icon: "solar:document-text-line-duotone",
        id: uniqueId(),
        url: "/responsable/aprobar-documentos",
        isPro: false,
        roles: ['responsable'],
        description: "Revisa y aprueba los documentos adjuntos en las inscripciones.",
      },
      {
        name: "Estudiante",
        icon: "solar:user-line-duotone",
        id: uniqueId(),
        url: "/estudiante/mis-eventos",
        isPro: false,
        description: "Visualiza tus eventos inscritos y tu progreso.",
      },
    ],
  },
  {
    heading: "Validación",
    roles: ['administrador'],
    children: [
      {
        name: "Validar Carreras",
        icon: "solar:user-check-rounded-line-duotone",
        id: uniqueId(),
        url: "/admin/validar-carreras",
        isPro: false,
        roles: ['administrador'],
        description: "Gestiona y valida la aprobación de carreras para estudiantes.",
      },
    ],
  },
  {
    heading: "Ajustes del Sistema",
    roles: ['administrador'],
    children: [
      {
        name: "Configuración",
        icon: "solar:settings-line-duotone",
        id: uniqueId(),
        url: "/configuracion",
        isPro: false,
        roles: ['administrador'],
        description: "Ajusta la configuración general de la aplicación, incluyendo la apariencia.",
      },
      {
        name: "Auditoría",
        icon: "solar:shield-check-line-duotone",
        id: uniqueId(),
        url: "/admin/auditoria",
        isPro: false,
        roles: ['administrador'],
        description: "Revisa el registro de actividades y cambios en el sistema.",
      },
    ],
  },
];

export default SidebarContent;