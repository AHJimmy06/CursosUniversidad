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
    ],
  },
  {
    heading: "ADMINISTRACIÓN",
    children: [
      {
        name: "Gestión de Usuarios",
        icon: "solar:users-group-two-rounded-line-duotone",
        id: uniqueId(),
        url: "/admin/usermanagement",
        isPro: false,
      },
      {
        name: "Eventos",
        icon: "solar:calendar-line-duotone",
        id: uniqueId(),
        url: "/eventos",
        isPro: false,
        roles: ["administrador"],
        children: [
          {
            name: "Crear Evento",
            icon: "solar:document-add-line-duotone",
            id: uniqueId(),
            url: "/eventos/crear",
            isPro: false,
            roles: ["administrador"],
          },
          {
            name: "Listar Eventos",
            icon: "solar:list-bold",
            id: uniqueId(),
            url: "/eventos/listar",
            isPro: false,
            roles: ["administrador"],
          },
        ],
      },
    ],
  },
];

export default SidebarContent;
