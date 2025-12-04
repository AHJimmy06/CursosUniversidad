import React, { ReactNode } from 'react';
import LandingNavbar from './LandingNavbar';
import { Footer } from 'flowbite-react';
import { BsFacebook, BsGithub, BsInstagram, BsTwitter } from 'react-icons/bs';
import Logo from 'src/layouts/full/shared/logo/Logo';
import { Link } from 'react-router-dom';

interface LandingPageLayoutProps {
  children: ReactNode;
}

const LandingPageLayout: React.FC<LandingPageLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-darkgray text-gray-800 dark:text-white">
      <LandingNavbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer container className="bg-white dark:bg-dark text-gray-800 dark:text-white p-6 mt-8 rounded-none">
        <div className="w-full max-w-screen-xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 py-8 text-center">
            <div>
              <Footer.Title title="Acerca de" />
              <Footer.LinkGroup col className="justify-center">
                <Footer.Link as={Link} to="/landing/about">Sobre Nosotros</Footer.Link>
                <Footer.Link as={Link} to="/landing/contact">Contacto</Footer.Link>
              </Footer.LinkGroup>
            </div>
            <div>
              <Footer.Title title="Síguenos" />
              <Footer.LinkGroup col className="justify-center">
                <Footer.Link href="https://github.com/AHJimmy06/CursosUniversidad" target="_blank">Github</Footer.Link>
              </Footer.LinkGroup>
            </div>
            <div>
              <Footer.Title title="Legal" />
              <Footer.LinkGroup col className="justify-center">
                <Footer.Link as={Link} to="/landing/privacy-policy">Política de Privacidad</Footer.Link>
                <Footer.Link as={Link} to="/landing/terms-and-conditions">Términos y Condiciones</Footer.Link>
              </Footer.LinkGroup>
            </div>
          </div>
          <Footer.Divider />
          <div className="w-full text-center">
            <Footer.Copyright
              by="CursosU. Todos los derechos reservados."
              href="#"
              year={new Date().getFullYear()}
            />
          </div>
        </div>
      </Footer>
    </div>
  );
};

export default LandingPageLayout;
