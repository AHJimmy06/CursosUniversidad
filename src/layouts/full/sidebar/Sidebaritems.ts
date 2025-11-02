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
    heading: "INICIO",
    children: [
      {
        name: "Página Principal",
        icon: "solar:widget-add-line-duotone",
        id: uniqueId(),
        url: "/",
        isPro: false,
      },
      {
        name: "Catálogo de Cursos",
        icon: "solar:book-2-line-duotone",
        id: uniqueId(),
        url: "/catalogo",
        isPro: false,
      },
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
            roles: ['administrador'],
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
      {
        name: "Configuración",
        icon: "solar:settings-line-duotone", // Un ícono apropiado
        id: uniqueId(),
        url: "/configuracion", // La ruta para la nueva página
        isPro: false,
        roles: ['administrador'], // ¡Crucial para la seguridad!
      }
    ]
  }
];

export default SidebarContent;