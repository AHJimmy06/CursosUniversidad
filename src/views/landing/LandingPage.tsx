import React, { useState, useEffect } from 'react';
import { supabase } from 'src/utils/supabaseClient';
import { Evento } from 'src/types/eventos';
import EventoCard from '../catalogo/components/EventoCard';
import { Spinner, Alert, Button } from 'flowbite-react';
import { Link } from 'react-router-dom';
import { useModal } from 'src/contexts/ModalContext';

const LandingPage: React.FC = () => {
  const [featuredEvents, setFeaturedEvents] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showModal, hideModal } = useModal(); 

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
  
  // Removed openLoginModal function

  return (
    <div className="bg-gray-50 text-gray-800">
      {/* Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">CursosU</div>
          <div>
            <Link to="/auth/login"> {/* Changed to Link to login page */}
              <Button color="blue">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="bg-blue-600 text-white text-center py-20">
        <div className="container mx-auto px-6">
          <h1 className="text-5xl font-bold mb-4">Transforma tu Futuro con Nuestra Educación de Calidad</h1>
          <p className="text-xl mb-8">Únete a miles de estudiantes y profesionales que están llevando sus carreras al siguiente nivel.</p>
          <div className="flex justify-center">
            <Link to="/auth/register">
              <Button size="xl" color="light">
                Regístrate Gratis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Featured Courses Section */}
      <main className="container mx-auto px-6 py-12">
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
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; {new Date().getFullYear()} CursosU. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
