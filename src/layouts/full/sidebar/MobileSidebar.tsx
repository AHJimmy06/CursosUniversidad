
import { Sidebar } from "flowbite-react";
import SidebarContent from "./Sidebaritems";
import NavItems from "./NavItems";
import SimpleBar from "simplebar-react";
import React from "react";
import FullLogo from "../shared/logo/FullLogo";
import 'simplebar-react/dist/simplebar.min.css';
import Upgrade from "./Upgrade";
import { useUser } from "../../../contexts/UserContext";

const MobileSidebar = () => {
  const { profile } = useUser();

  const filteredSidebarContent = SidebarContent.map(section => ({
    ...section,
    children: section.children?.filter(child => {
      if (section.heading === "ADMINISTRACIÓN") {
        return profile?.rol === 'administrador';
      }
      return true;
    })
  })).filter(section => section.children && section.children.length > 0);

  return (
    <>
      <div>
        <Sidebar
          className="fixed menu-sidebar pt-0 bg-white dark:bg-darkgray transition-all"
          aria-label="Sidebar with multi-level dropdown example"
        >
          <div className="px-5 py-4 pb-7 flex items-center sidebarlogo">
            <FullLogo />
          </div>
          <SimpleBar className="h-[calc(100vh_-_242px)]">
            <Sidebar.Items className="px-5 mt-2">
              <Sidebar.ItemGroup className="sidebar-nav hide-menu">
                {filteredSidebarContent &&
                  filteredSidebarContent?.map((item, index) => (
                    <div className="caption" key={item.heading}>
                      <React.Fragment key={index}>
                        <h5 className="text-link dark:text-white/70 caption font-semibold leading-6 tracking-widest text-xs pb-2 uppercase">
                          {item.heading}
                        </h5>
                        {item.children?.map((child, index) => (
                          <React.Fragment key={child.id && index}>
                              <NavItems item={child} />
                          </React.Fragment>
                        ))}
                      </React.Fragment>
                    </div>
                  ))}
              </Sidebar.ItemGroup>
            </Sidebar.Items>
          </SimpleBar>
          <Upgrade/>
        </Sidebar>
      </div>
    </>
  );
};

export default MobileSidebar;
