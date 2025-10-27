import { Sidebar } from "flowbite-react";
// --- CORRECCIÓN 1: Importar los tipos MenuItem y ChildItem ---
import SidebarContent, { MenuItem, ChildItem } from "./Sidebaritems";
import NavItems from "./NavItems";
import SimpleBar from "simplebar-react";
import React, { useMemo } from "react";
import FullLogo from "../shared/logo/FullLogo";
import NavCollapse from "./NavCollapse";
// ¡Asegúrate de que la ruta a tu UserContext sea correcta!
import { useUser } from "../../../contexts/UserContext";

const SidebarLayout = () => {
  const { profile } = useUser();
  const userRole = profile?.rol;

  // --- CORRECCIÓN 2: Definir explícitamente los tipos de entrada y SALIDA de la función ---
  // La función recibe un array (que puede ser undefined) y SIEMPRE devuelve un array.
  const filterItemsByRole = (
    items: (MenuItem | ChildItem)[] | undefined
  ): (MenuItem | ChildItem)[] => {
    // Si los items son undefined o nulos, devolvemos un array vacío inmediatamente.
    if (!items) {
      return [];
    }

    // El resto de la lógica ya era correcta, pero ahora TypeScript la entiende.
    return items
      .filter((item) => {
        const isPublic = !item.roles;
        const hasAccess = userRole && item.roles?.includes(userRole);
        return isPublic || hasAccess;
      })
      .map((item) => {
        // Si el ítem tiene hijos, filtramos a los hijos también recursivamente.
        if (item.children) {
          return { ...item, children: filterItemsByRole(item.children) };
        }
        return item;
      });
  };

  // useMemo sigue siendo una buena práctica para la eficiencia.
  const filteredSidebarContent = useMemo(
    () => filterItemsByRole(SidebarContent),
    [userRole] // Se vuelve a calcular solo si el rol del usuario cambia
  );

  return (
    <>
      <div className="xl:block hidden">
        <Sidebar
          className="fixed menu-sidebar bg-white dark:bg-darkgray rtl:pe-4 rtl:ps-0 top-[69px]"
          aria-label="Sidebar with multi-level dropdown example"
        >
          <div className="px-6 py-4 flex items-center justify-center sidebarlogo">
            <FullLogo />
          </div>
          <SimpleBar className="h-[calc(100vh_-_130px)]">
            <Sidebar.Items className="px-5 mt-2">
              <Sidebar.ItemGroup className="sidebar-nav hide-menu">
                {filteredSidebarContent.map((item, index) =>
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