import React from 'react';
import { Card } from 'flowbite-react';
import LandingPageLayout from 'src/layouts/landing/LandingPageLayout';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

const AboutUsPage: React.FC = () => {
  return (
    <LandingPageLayout>
      <div className="container mx-auto px-6 py-12">
        <Card className="relative">
          <Link to="/landing" className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
            <Icon icon="solar:alt-arrow-right-linear" height={24} rotate={2} />
          </Link>
          <h1 className="text-3xl font-bold mb-4">Sobre Nosotros</h1>
          <div className="prose dark:prose-invert max-w-none">
            <p>
              Bienvenido a CursosU, la plataforma líder en gestión de eventos académicos y cursos de la Facultad de Ingeniería en Sistemas, Electrónica e Industrial (FISEI). Nuestra misión es proporcionar una herramienta centralizada y eficiente para que estudiantes, docentes y administradores puedan organizar y participar en eventos que enriquezcan la experiencia universitaria.
            </p>
            <p>
              Nuestra plataforma ha sido desarrollada por un equipo de estudiantes apasionados de la FISEI, con el objetivo de resolver las necesidades de nuestra comunidad académica. Creemos en el poder de la tecnología para simplificar procesos y conectar a las personas.
            </p>
            <p>
              En CursosU, puedes explorar un catálogo completo de cursos, conferencias y talleres, inscribirte fácilmente, y dar seguimiento a tu progreso académico, todo en un solo lugar.
            </p>
          </div>
        </Card>
      </div>
    </LandingPageLayout>
  );
};

export default AboutUsPage;
