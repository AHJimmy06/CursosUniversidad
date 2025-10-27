import { uniqueId } from "lodash";

export interface ChildItem {
  id?: number | string;
  name?: string;
  icon?: any;
  children?: ChildItem[];
  item?: any;
  url?: any;
  color?: string;
  isPro?:boolean
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
  isPro?:boolean
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
        name: "Asignación de Responsables",
        icon: "solar:calendar-line-duotone",
        id: uniqueId(),
        url: "/admin/events",
        isPro: false,
      },
    ],
  }
];

export default SidebarContent;
