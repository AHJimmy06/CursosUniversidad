import { Sidebar } from "flowbite-react";
import SidebarContent, { MenuItem, ChildItem } from "./Sidebaritems";
import NavItems from "./NavItems";
import SimpleBar from "simplebar-react";
import React, { useMemo } from "react";
// Ya no necesitamos FullLogo, así que podemos comentarlo o eliminarlo
// import FullLogo from "../shared/logo/FullLogo"; 
import NavCollapse from "./NavCollapse";
import { useUser } from "../../../contexts/UserContext";

// --- CAMBIO 1: Importar el hook 'useTheme' que creamos en App.tsx ---
import { useTheme } from "../../../App"; // ¡Asegúrate de que la ruta a tu App.tsx sea correcta!

const SidebarLayout = () => {
  const { profile } = useUser();
  const userRole = profile?.rol;
  
  // --- CAMBIO 2: Usar el hook para obtener la configuración del tema ---
  const theme = useTheme();

  // La función de filtrado de roles es correcta, no necesita cambios
  const filterItemsByRole = (
    items: (MenuItem | ChildItem)[] | undefined
  ): (MenuItem | ChildItem)[] => {
    if (!items) return [];
    return items
      .filter((item) => {
        const isPublic = !item.roles;
        const hasAccess = userRole && item.roles?.includes(userRole);
        return isPublic || hasAccess;
      })
      .map((item) => {
        if (item.children) {
          return { ...item, children: filterItemsByRole(item.children) };
        }
        return item;
      });
  };

  // Esta parte, como la tenías, estaba bien y la mantenemos.
  const filteredSidebarContent = useMemo(
    () => filterItemsByRole(SidebarContent),
    [userRole]
  );

  return (
    <>
      <div className="xl:block hidden">
        <Sidebar
          className="fixed menu-sidebar bg-white dark:bg-darkgray rtl:pe-4 rtl:ps-0 top-[69px]"
          aria-label="Sidebar with multi-level dropdown example"
        >
          <div className="px-6 py-4 flex items-center justify-center sidebarlogo">
            <img 
              src={theme?.logo_url || 'https://via.placeholder.com/150?text=Logo'}
              alt="Logo del Sitio"
              // --- ÚNICO CAMBIO REALIZADO ---
              className="h-32 w-auto object-contain" 
            />
          </div>
          <SimpleBar className="h-[calc(100vh_-_130px)]">
            <Sidebar.Items className="px-5 mt-2">
              <Sidebar.ItemGroup className="sidebar-nav hide-menu">
                {filteredSidebarContent.map((item, index) =>
                  // Esta comprobación 'heading' in item es una forma inteligente de solucionar el error de tipos. La mantenemos.
                  'heading' in item ? (
                    <div className="caption" key={item.heading || index}>
                      <React.Fragment key={index}>
                        <h5 className="text-link dark:text-white/70 caption font-semibold leading-6 tracking-widest text-xs pb-2 uppercase">
                          {item.heading}
                        </h5>
                        {filterItemsByRole(item.children).map((child, childIndex) => (
                          <React.Fragment key={child.id || childIndex}>
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
                  ) : null
                )}
              </Sidebar.ItemGroup>
            </Sidebar.Items>
          </SimpleBar>
        </Sidebar>
      </div>
    </>
  );
};

export default SidebarLayout;