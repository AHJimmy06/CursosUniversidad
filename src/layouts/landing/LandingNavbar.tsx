import React from 'react';
import { Button, Navbar } from 'flowbite-react';
import { Link } from 'react-router-dom';
import Logo from 'src/layouts/full/shared/logo/Logo';

const LandingNavbar: React.FC = () => {
  return (
    <Navbar fluid rounded className="bg-white shadow-md sticky top-0 z-50 py-3">
      <Navbar.Brand as={Link} to="/">
        <Logo />
      </Navbar.Brand>
      <div className="flex md:order-2">
        <Link to="/auth/login">
          <Button color="primary">
            Iniciar Sesión
          </Button>
        </Link>
        <Navbar.Toggle />
      </div>
      <Navbar.Collapse>
        {/* Navigation links if any, currently only login button */}
      </Navbar.Collapse>
    </Navbar>
  );
};

export default LandingNavbar;
