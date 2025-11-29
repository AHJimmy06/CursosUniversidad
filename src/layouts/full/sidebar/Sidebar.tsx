import { Sidebar } from "flowbite-react";
import SidebarContent, { MenuItem, ChildItem } from "./Sidebaritems";
import NavItems from "./NavItems";
import SimpleBar from "simplebar-react";
import React, { useMemo } from "react";
import NavCollapse from "./NavCollapse";
import { useUser } from "../../../contexts/UserContext";
import { useThemeConfig } from "../../../contexts/ThemeContext";

const SidebarLayout = () => {
  const { profile, isDocente, isResponsable } = useUser();
  const { config: theme } = useThemeConfig();
  
  // Extraemos los roles una sola vez para las dependencias
  const allUserRoles = profile?.cdc_roles;

  // --- OPTIMIZACIÓN AQUÍ ---
  // La lógica de filtrado ahora vive DENTRO del useMemo.
  // Solo se recalcula si cambian los roles o el perfil del usuario.
  const filteredSidebarContent = useMemo(() => {
    
    // Función recursiva local
    const filterRecursive = (items: (MenuItem | ChildItem)[] | undefined): (MenuItem | ChildItem)[] => {
      if (!items) return [];

      return items
        .filter((item) => {
          // 1. Filtros directos por banderas booleanas
          if (item.name === 'Docente') return isDocente;
          if (item.name === 'Responsable') return isResponsable;

          // 2. Filtros por roles (RBAC)
          const isPublic = !item.roles || item.roles.length === 0;
          if (isPublic) return true;

          const hasAccess = allUserRoles && item.roles?.some(requiredRole => allUserRoles.includes(requiredRole));
          return hasAccess ?? false;
        })
        .map((item) => {
          // 3. Procesar hijos recursivamente
          if (item.children) {
            const filteredChildren = filterRecursive(item.children);

            // Si tiene hijos válidos, devolvemos el padre con los hijos nuevos
            if (filteredChildren.length > 0) {
              return { ...item, children: filteredChildren };
            }

            // Si todos los hijos fueron filtrados (eliminados):
            // Solo mostramos el padre si el padre mismo es un enlace clicable (url)
            // Si es solo un contenedor (collapse) vacío, lo ocultamos devolviendo null.
            return item.url ? { ...item, children: [] } : null;
          }
          
          // Si no tiene hijos, es un item final, lo devolvemos tal cual
          return item;
        })
        .filter(Boolean) as (MenuItem | ChildItem)[]; // Eliminar los nulls generados
    };

    return filterRecursive(SidebarContent);

  }, [allUserRoles, isDocente, isResponsable]); // Dependencias estables

  return (
    <div className="xl:block hidden">
      <Sidebar
        className="fixed menu-sidebar bg-white dark:bg-darkgray rtl:pe-4 rtl:ps-0 top-[69px]"
        aria-label="Sidebar Navigation"
      >
        <div className="px-6 py-4 flex items-center justify-center sidebarlogo">
           {/* Agregamos una validación simple para evitar layout shifts si no hay logo */}
           {theme.logo_url ? (
             <img 
               src={theme.logo_url}
               alt="Logo Institucional"
               className="h-32 w-auto object-contain" 
             />
           ) : (
             <span className="text-xl font-bold">Logo</span> 
           )}
        </div>
        
        <SimpleBar className="h-[calc(100vh_-_130px)]">
          <Sidebar.Items className="px-5 mt-2">
            <Sidebar.ItemGroup className="sidebar-nav hide-menu">
              {filteredSidebarContent.map((item, index) => {
                // Verificamos si es un encabezado (Grupo)
                if ('heading' in item) {
                  // Solo renderizamos el grupo si tiene hijos visibles
                  if (item.children && item.children.length > 0) {
                    return (
                      <div className="caption" key={item.heading || index}>
                        <React.Fragment>
                          <h5 className="text-link dark:text-white/70 caption font-semibold leading-6 tracking-widest text-xs pb-2 uppercase">
                            {item.heading}
                          </h5>
                          {item.children.map((child) => (
                            <React.Fragment key={child.id}>
                              {child.children ? (
                                <div className="collpase-items">
                                  <NavCollapse item={child} />
                                </div>
                              ) : (
                                <NavItems item={child} />
                              )}
                            </React.Fragment>
                          ))}
                        </React.Fragment>
                      </div>
                    );
                  }
                }
                return null;
              })}
            </Sidebar.ItemGroup>
          </Sidebar.Items>
        </SimpleBar>
      </Sidebar>
    </div>
  );
};

export default SidebarLayout;