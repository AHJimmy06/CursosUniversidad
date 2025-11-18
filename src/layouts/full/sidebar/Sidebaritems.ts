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
      },
      {
        name: "Catálogo de Cursos",
        icon: "solar:book-2-line-duotone",
        id: uniqueId(),
        url: "/catalogo",
        isPro: false,
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
        children: [
          {
            name: "Crear Evento",
            icon: "solar:document-add-line-duotone",
            id: uniqueId(),
            url: "/eventos/crear",
            isPro: false,
          },
          {
            name: "Listar Eventos",
            icon: "solar:list-bold",
            id: uniqueId(),
            url: "/eventos/listar",
            isPro: false,
            roles: ['administrador'],
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
        children: [
          {
            name: "Lista de Usuarios",
            icon: "solar:list-bold",
            id: uniqueId(),
            url: "/usuarios/listar",
            isPro: false,
            roles: ['administrador'],
          },
          {
            name: "Crear Usuario",
            icon: "solar:user-plus-line-duotone",
            id: uniqueId(),
            url: "/usuarios/crear",
            isPro: false,
            roles: ['administrador'],
          }
        ]
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
      },
      {
        name: "Responsable",
        icon: "solar:user-check-line-duotone",
        id: uniqueId(),
        url: "/responsable/eventos",
        isPro: false,
      },
      {
        name: "Estudiante",
        icon: "solar:user-line-duotone",
        id: uniqueId(),
        url: "/estudiante/mis-eventos",
        isPro: false,
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
      },
    ],
  },
];

export default SidebarContent;