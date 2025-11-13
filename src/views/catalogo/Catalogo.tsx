import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from 'src/utils/supabaseClient';
import { Evento, Carrera } from 'src/types/eventos';
import EventoCard from './components/EventoCard';
import FiltrosCatalogo from './components/FiltrosCatalogo';
import { Alert, Spinner } from 'flowbite-react';
import { useUser } from 'src/contexts/UserContext';

const Catalogo: React.FC = () => {
  const { user } = useUser();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filtros, setFiltros] = useState({
    tipo: '',
    carreraId: '',
    esPagado: 'todos',
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Step 1: Fetch visible event IDs
        let visibleEventIds: number[] = [];

        if (user) {
          const { data: idData, error: rpcError } = await supabase.rpc('get_visible_event_ids_for_user', {
            p_user_id: user.id,
          });
          if (rpcError) throw rpcError;
          visibleEventIds = idData.map((item: { id: number }) => item.id);
        } else {
          // For guests, fetch only public events
          const { data: publicEvents, error: publicEventsError } = await supabase
            .from('Eventos')
            .select('id')
            .eq('estado', 'publicado')
            .eq('audiencia', 'publico_general');
          if (publicEventsError) throw publicEventsError;
          visibleEventIds = publicEvents.map(item => item.id);
        }

        if (visibleEventIds.length === 0) {
            setEventos([]);
            setCarreras([]); // Also clear careers if no events are visible
            setLoading(false);
            return;
        }

        // Step 2: Fetch full event data for visible events
        const { data: eventosData, error: eventosError } = await supabase
          .from('Eventos')
          .select('*, carreras(id, nombre)')
          .in('id', visibleEventIds);

        if (eventosError) throw eventosError;

        // Step 3: Filter out events the user is already part of (enrolled, teacher, responsible)
        let eventosFiltradosPorUsuario = eventosData || [];
        if (user) {
          const { data: inscripciones, error: inscripcionesError } = await supabase
            .from('inscripciones')
            .select('evento_id')
            .eq('usuario_id', user.id);

          if (inscripcionesError) throw inscripcionesError;

          const eventosInscritosIds = inscripciones.map(i => i.evento_id);

          eventosFiltradosPorUsuario = (eventosData || []).filter(evento => {
            const esDocente = evento.docente_id === user.id;
            const esResponsable = evento.responsable_id === user.id;
            const esEstudiante = eventosInscritosIds.includes(evento.id);

            return !esDocente && !esResponsable && !esEstudiante;
          });
        }
        
        setEventos(eventosFiltradosPorUsuario);

        // Step 4: Fetch careers for the filter dropdown (user-specific)
        let careersForFilter: Carrera[] = [];
        if (user) {
            const { data: userCareersData, error: userCareersError } = await supabase
                .from('perfiles_carreras')
                .select('carreras (id, nombre)')
                .eq('usuario_id', user.id);

            if (userCareersError) throw userCareersError;

            if (userCareersData) {
                careersForFilter = userCareersData
                    .map(item => item.carreras)
                    .filter(Boolean) as Carrera[];
            }
        }
        setCarreras(careersForFilter);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePagadoChange = (checked: boolean) => {
    setFiltros(prev => ({ ...prev, esPagado: checked ? 'pago' : 'todos' }));
  };

  const eventosFiltrados = useMemo(() => {
    return eventos.filter(evento => {
      const filtroTipo = !filtros.tipo || evento.tipo === filtros.tipo;
      const filtroCarrera = !filtros.carreraId || evento.audiencia !== 'estudiantes_carrera' || evento.carreras.some(c => c.id.toString() === filtros.carreraId);
      const filtroPagado = filtros.esPagado === 'todos' || (filtros.esPagado === 'pago' && evento.es_pagado);
      
      return filtroTipo && filtroCarrera && filtroPagado;
    });
  }, [eventos, filtros]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="xl" />
        <span className="pl-3">Cargando eventos...</span>
      </div>
    );
  }

  if (error) {
    return <Alert color="failure">Error al cargar los datos: {error}</Alert>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Catálogo de Cursos y Eventos</h1>
      <FiltrosCatalogo
        carreras={carreras}
        filtros={filtros}
        onFiltroChange={handleFiltroChange}
        onPagadoChange={handlePagadoChange}
      />
      {eventosFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventosFiltrados.map(evento => (
            <EventoCard key={evento.id} evento={evento} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-lg text-gray-500">No se encontraron eventos disponibles para ti o que coincidan con los filtros.</p>
        </div>
      )}
    </div>
  );
};

export default Catalogo;