import React, { useState, useEffect } from 'react';
import { supabase } from 'src/utils/supabaseClient';
import { Evento } from 'src/types/eventos';
import EventoCard from '../catalogo/components/EventoCard';
import { Spinner, Alert, Button } from 'flowbite-react';
import { Link } from 'react-router-dom';
import LandingPageLayout from 'src/layouts/landing/LandingPageLayout';

const LandingPage: React.FC = () => {
  const [featuredEvents, setFeaturedEvents] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('Eventos')
          .select('*, carreras(id, nombre)')
          .eq('is_featured', true)
          .eq('estado', 'publicado');

        if (error) throw error;
        setFeaturedEvents(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedEvents();
  }, []);

  return (
    <LandingPageLayout>
      {/* Hero Section */}
      <header className="bg-gray-100 text-gray-900 text-center py-20">
        <div className="container mx-auto px-6">
          <h1 className="text-5xl font-extrabold mb-4 leading-tight">Desbloquea tu Potencial: Cursos y Eventos que Impulsan tu Carrera</h1>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">Sumérgete en un mundo de conocimiento. Conéctate con expertos, domina nuevas habilidades y sé parte de la comunidad académica que define el futuro. Tu crecimiento empieza aquí.</p>
          <div className="flex justify-center">
            <Link to="/auth/register">
              <Button size="xl" color="primary">
                Comienza tu Transformación
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Featured Courses Section */}
      <section className="container mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-center mb-8">Eventos Destacados</h2>
        {loading ? (
          <div className="flex justify-center"><Spinner size="xl" /></div>
        ) : error ? (
          <Alert color="failure">Error al cargar eventos: {error}</Alert>
        ) : featuredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredEvents.map(evento => (
              <EventoCard key={evento.id} evento={evento} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No hay eventos destacados en este momento. ¡Vuelve pronto!</p>
        )}
      </section>
    </LandingPageLayout>
  );
};

export default LandingPage;
