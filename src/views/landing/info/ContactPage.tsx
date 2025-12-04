import React from 'react';
import { Card } from 'flowbite-react';
import LandingPageLayout from 'src/layouts/landing/LandingPageLayout';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

const ContactPage: React.FC = () => {
  return (
    <LandingPageLayout>
      <div className="container mx-auto px-6 py-12">
        <Card className="relative">
          <Link to="/landing" className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
            <Icon icon="solar:alt-arrow-right-linear" height={24} rotate={2} />
          </Link>
          <h1 className="text-3xl font-bold mb-4">Contacto</h1>
          <div className="prose dark:prose-invert max-w-none">
            <p>
              Si tienes alguna pregunta, sugerencia o necesitas soporte técnico, no dudes en contactar a nuestro equipo:
            </p>
            
            <h2 className="text-xl font-semibold mt-6">Líder Técnico</h2>
            <p>
              <strong>Nombre:</strong> Jimmy Añilema<br />
              <strong>Email:</strong> jimmy.anilema234@gmail.com
            </p>

            <h2 className="text-xl font-semibold mt-6">Gestor de Cambios</h2>
            <p>
              <strong>Nombre:</strong> Bryan Quitto<br />
              <strong>Email:</strong> bryanleninqn@gmail.com
            </p>
          </div>
        </Card>
      </div>
    </LandingPageLayout>
  );
};

export default ContactPage;
