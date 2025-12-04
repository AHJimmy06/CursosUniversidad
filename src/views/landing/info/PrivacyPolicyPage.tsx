import React from 'react';
import { Card } from 'flowbite-react';
import LandingPageLayout from 'src/layouts/landing/LandingPageLayout';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <LandingPageLayout>
      <div className="container mx-auto px-6 py-12">
        <Card className="relative">
          <Link to="/landing" className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
            <Icon icon="solar:alt-arrow-right-linear" height={24} rotate={2} />
          </Link>
          <h1 className="text-3xl font-bold mb-4">Política de Privacidad</h1>
          <div className="prose dark:prose-invert max-w-none">
            <p>
              En CursosU, respetamos tu privacidad y nos comprometemos a proteger tus datos personales. Esta política de privacidad describe cómo recopilamos, usamos y compartimos tu información.
            </p>

            <h2 className="text-xl font-semibold mt-6">1. Información que Recopilamos</h2>
            <p>
              Recopilamos información que nos proporcionas directamente, como tu nombre, correo electrónico, y datos académicos al inscribirte en un curso. También recopilamos datos técnicos de manera automática, como tu dirección IP y tipo de navegador.
            </p>

            <h2 className="text-xl font-semibold mt-6">2. Cómo Usamos tu Información</h2>
            <p>
              Utilizamos tu información para administrar tu cuenta, procesar tus inscripciones, comunicarnos contigo, y mejorar nuestros servicios.
            </p>
            
            <h2 className="text-xl font-semibold mt-6">3. Cómo Compartimos tu Información</h2>
            <p>
              No compartimos tu información personal con terceros, excepto cuando es necesario para proveer nuestros servicios (por ejemplo, con procesadores de pago) o si la ley nos lo exige.
            </p>
          </div>
        </Card>
      </div>
    </LandingPageLayout>
  );
};

export default PrivacyPolicyPage;
