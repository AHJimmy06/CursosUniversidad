import React from 'react';
import { Card } from 'flowbite-react';
import LandingPageLayout from 'src/layouts/landing/LandingPageLayout';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

const TermsAndConditionsPage: React.FC = () => {
  return (
    <LandingPageLayout>
      <div className="container mx-auto px-6 py-12">
        <Card className="relative">
          <Link to="/landing" className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
            <Icon icon="solar:alt-arrow-right-linear" height={24} rotate={2} />
          </Link>
          <h1 className="text-3xl font-bold mb-4">Términos y Condiciones</h1>
          <div className="prose dark:prose-invert max-w-none">
            <p>
              Al utilizar CursosU, aceptas los siguientes términos y condiciones. Por favor, léelos cuidadosamente.
            </p>

            <h2 className="text-xl font-semibold mt-6">1. Uso Aceptable</h2>
            <p>
              Aceptas utilizar nuestra plataforma únicamente con fines educativos y lícitos. No debes usar la plataforma de ninguna manera que pueda dañar, deshabilitar o sobrecargar nuestros servidores.
            </p>

            <h2 className="text-xl font-semibold mt-6">2. Cuentas de Usuario</h2>
            <p>
              Eres responsable de mantener la confidencialidad de tu cuenta y contraseña. Aceptas la responsabilidad de todas las actividades que ocurran bajo tu cuenta.
            </p>
            
            <h2 className="text-xl font-semibold mt-6">3. Propiedad Intelectual</h2>
            <p>
              El contenido de esta plataforma, incluyendo textos, gráficos y logos, es propiedad de CursosU y está protegido por las leyes de derechos de autor.
            </p>
          </div>
        </Card>
      </div>
    </LandingPageLayout>
  );
};

export default TermsAndConditionsPage;
