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
  roles?: string[]; // Añadir la propiedad roles aquí
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
  roles?: string[]; // Ya está aquí
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
        name: "Eventos", 
        icon: "solar:calendar-line-duotone", 
        id: uniqueId(),
        url: "/eventos", 
        isPro: false,
        roles: ['administrador'], // Solo visible para administradores
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
      }
    ]
  }
];

export default SidebarContent;