import { FC } from 'react';
import { Outlet } from "react-router";
import ScrollToTop from 'src/components/shared/ScrollToTop';
import Sidebar from './sidebar/Sidebar';
import Header from './header/Header';
import { useUser } from 'src/contexts/UserContext';

const FullLayout: FC = () => {
  const { activeRole } = useUser();
  const isAdmin = activeRole === 'administrador';

  return (
    <>
      <div className="flex w-full min-h-screen dark:bg-darkgray">
        <div className={`page-wrapper flex w-full ${!isAdmin ? 'ml-0' : ''}`}>
          {isAdmin && <Sidebar />}
          <div className="page-wrapper-sub flex flex-col w-full dark:bg-darkgray">
            <Header />
            <div className="bg-lightgray dark:bg-dark h-full">
              <div className="w-full">
                <ScrollToTop>
                  <div className="container py-30">
                    <Outlet />
                  </div>
                </ScrollToTop>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FullLayout;
