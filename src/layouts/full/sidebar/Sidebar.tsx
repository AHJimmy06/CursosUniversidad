import { Sidebar } from "flowbite-react";
import SidebarContent, { MenuItem, ChildItem } from "./Sidebaritems";
import NavItems from "./NavItems";
import SimpleBar from "simplebar-react";
import React, { useMemo } from "react";
import NavCollapse from "./NavCollapse";
import { useUser } from "../../../contexts/UserContext";
import { useThemeConfig } from "../../../contexts/ThemeContext";

const SidebarLayout = () => {
  const { profile, activeRole } = useUser();
  const { config: theme } = useThemeConfig();
  
  const allUserRoles = useMemo(() => {
    const roles = new Set<string>(profile?.cdc_roles || []);
    if (profile?.rol) roles.add(profile.rol);
    return Array.from(roles);
  }, [profile]);

  const filteredSidebarContent = useMemo(() => {
    
    const filterRecursive = (items: (MenuItem | ChildItem)[] | undefined): (MenuItem | ChildItem)[] => {
      if (!items) return [];

      return items
        .filter((item) => {
          if (item.name === 'Catálogo de Cursos') {
            return ['usuario', 'estudiante'].includes(activeRole);
          }
          
          if (activeRole === 'administrador') {
            if (item.name === 'Docente' || item.name === 'Responsable' || item.name === 'Estudiante' || item.name === 'Usuario') {
                return false;
            }
            const isPublic = !item.roles || item.roles.length === 0;
            const isAdminItem = item.roles?.includes('administrador');
            return isPublic || isAdminItem;
          }

          if (item.name === 'Docente') return activeRole === 'docente';
          if (item.name === 'Responsable') return activeRole === 'responsable';
          if (item.name === 'Estudiante') return activeRole === 'estudiante';
          
          if (activeRole === 'usuario') {
              const isPublic = !item.roles || item.roles.length === 0;
              return isPublic;
          }
          
          return item.roles?.includes(activeRole) ?? false;
        })
        .map((item) => {
          if (item.children) {
            const filteredChildren = filterRecursive(item.children);

            if (filteredChildren.length > 0) {
              return { ...item, children: filteredChildren };
            }

            return item.url ? { ...item, children: [] } : null;
          }
          
          return item;
        })
        .filter(Boolean) as (MenuItem | ChildItem)[];
    };

    return filterRecursive(SidebarContent);

  }, [activeRole]); // Dependencias estables

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