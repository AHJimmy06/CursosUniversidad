import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Evento } from '../../types/eventos';
import EventoCard from '../catalogo/components/EventoCard';
import { Alert, Spinner } from 'flowbite-react';
import { useUser } from '../../contexts/UserContext';

const ResponsableEventos: React.FC = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, activeRole } = useUser(); // Get activeRole from useUser()

  useEffect(() => {
    const fetchEventos = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);
      try {
        const { data: eventosData, error: eventosError } = await supabase
          .from('Eventos')
          .select('*, carreras(id, nombre)')
          .eq('responsable_id', user.id);

        if (eventosError) throw eventosError;

        setEventos(eventosData || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEventos();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="xl" />
        <span className="pl-3">Cargando mis eventos...</span>
      </div>
    );
  }

  if (error) {
    return <Alert color="failure">Error al cargar los datos: {error}</Alert>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Mis Eventos como Responsable</h1>
      {eventos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventos.map(evento => (
            <EventoCard evento={evento} key={evento.id} showCalificarButton={false} showValidarMatriculasButton={true} showApproveDocumentsButton={true} showEditButton={evento.estado !== 'publicado'} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-lg text-gray-500">No tienes eventos asignados como responsable.</p>
        </div>
      )}
    </div>
  );
};

export default ResponsableEventos;
