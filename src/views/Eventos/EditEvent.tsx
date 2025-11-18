import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { Evento } from '../../types/eventos';
import EditEventForm from './componentesEventos/EditEventForm';
import { Spinner, Alert } from 'flowbite-react';

const EditEvent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) {
        setError('No event ID provided.');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('Eventos')
          .select('*, carreras(id, nombre)')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setEvent(data);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleUpdate = () => {
    navigate('/responsable/eventos');
  };

  const handleClose = () => {
    navigate('/responsable/eventos');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="xl" />
        <span className="pl-3">Cargando evento...</span>
      </div>
    );
  }

  if (error) {
    return <Alert color="failure">Error: {error}</Alert>;
  }

  if (!event) {
    return <Alert color="warning">No se encontró el evento.</Alert>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Editar Evento</h2>
      <EditEventForm event={event} onUpdate={handleUpdate} onClose={handleClose} />
    </div>
  );
};

export default EditEvent;
