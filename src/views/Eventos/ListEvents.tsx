import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Table, Dropdown, Modal, Button, Alert } from 'flowbite-react';
import EditEventForm from './componentesEventos/EditEventForm';
import { Evento } from '../../types/eventos'; // Asegúrate que la ruta es correcta

const ListEvents: React.FC = () => {
  const [events, setEvents] = useState<Evento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);

  // La lógica para obtener los datos ya es correcta, no necesita cambios.
  const fetchEventsAndResponsables = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('Eventos')
        .select('id, nombre, estado, responsable_id');

      if (eventsError) throw eventsError;
      if (!eventsData || eventsData.length === 0) {
        setEvents([]);
        return;
      }

      const responsableIds = [...new Set(eventsData.map(e => e.responsable_id).filter(Boolean))];

      if (responsableIds.length === 0) {
        setEvents(eventsData.map(event => ({...event, estado: String(event.estado)})));
        return;
      }

      const { data: perfilesData, error: perfilesError } = await supabase
        .from('perfiles')
        .select('id, cedula, nombre1, apellido1')
        .in('id', responsableIds);

      if (perfilesError) throw perfilesError;

      const perfilesMap = new Map(perfilesData.map(p => [p.id, p]));
      const combinedData: Evento[] = eventsData.map(event => ({
        ...event,
        estado: String(event.estado),
        responsable: perfilesMap.get(event.responsable_id) || null,
      }));
      setEvents(combinedData);
    } catch (err: any) {
      console.error("Error detallado al obtener eventos:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsAndResponsables();
  }, []);

  const handleEdit = (event: Evento) => {
    setSelectedEvent(event);
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    setIsEditModalOpen(false);
    fetchEventsAndResponsables();
  };

  // --- CAMBIO 1: Nueva función genérica para cambiar el estado ---
  const handleChangeState = async (eventId: number, newState: 'activo' | 'inactivo' | 'borrador') => {
    if (window.confirm(`¿Estás seguro de que quieres cambiar el estado a "${newState}"?`)) {
      try {
        const { error } = await supabase
          .from('Eventos')
          .update({ estado: newState }) // El nuevo estado es dinámico
          .eq('id', eventId);

        if (error) throw error;

        // Actualiza el estado local para un feedback visual instantáneo
        setEvents(
          events.map(e =>
            e.id === eventId ? { ...e, estado: newState } : e
          )
        );
      } catch (err: any) {
        console.error(`Error al cambiar estado a ${newState}:`, err);
        alert('Error al cambiar el estado: ' + err.message);
      }
    }
  };

  // --- CAMBIO 3: Función auxiliar para los colores del estado ---
  const getStatusStyle = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'activo':
      case 'publicado':
        return 'bg-green-100 text-green-800';
      case 'inactivo':
        return 'bg-red-100 text-red-800';
      case 'borrador':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  if (loading) return <p>Cargando eventos...</p>;
  if (error) return <Alert color="failure">Error al cargar datos: {error}</Alert>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Listado de Eventos</h2>
      <Modal show={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <Modal.Header>Editar Evento</Modal.Header>
        <Modal.Body>
          {selectedEvent && (
            <EditEventForm
              event={selectedEvent}
              onClose={() => setIsEditModalOpen(false)}
              onUpdate={handleUpdate}
            />
          )}
        </Modal.Body>
      </Modal>

      {events.length === 0 ? (
        <p>No hay eventos disponibles.</p>
      ) : (
        <Table>
          <Table.Head>
            <Table.HeadCell>Nombre del Curso</Table.HeadCell>
            <Table.HeadCell>Responsable</Table.HeadCell>
            <Table.HeadCell>Cédula</Table.HeadCell>
            <Table.HeadCell>Estado</Table.HeadCell>
            <Table.HeadCell><span className="sr-only">Acciones</span></Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {events.map((event) => (
              <Table.Row key={event.id}>
                <Table.Cell className="font-medium">{event.nombre}</Table.Cell>
                <Table.Cell>{event.responsable ? `${event.responsable.nombre1} ${event.responsable.apellido1}` : 'No asignado'}</Table.Cell>
                <Table.Cell>{event.responsable?.cedula ?? 'N/A'}</Table.Cell>
                <Table.Cell>
                  <span className={`capitalize px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(event.estado)}`}>
                    {event.estado}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  {/* --- CAMBIO 2: Lógica condicional en el Dropdown --- */}
                  <Dropdown inline label="Acciones">
                    <Dropdown.Item onClick={() => handleEdit(event)}>
                      Editar
                    </Dropdown.Item>

                    {/* Mostrar solo las opciones de estado diferentes al actual */}
                    {event.estado !== 'activo' && event.estado !== 'publicado' && (
                      <Dropdown.Item onClick={() => handleChangeState(event.id, 'activo')}>
                        Marcar como Activo
                      </Dropdown.Item>
                    )}
                    {event.estado !== 'inactivo' && (
                      <Dropdown.Item onClick={() => handleChangeState(event.id, 'inactivo')}>
                        Marcar como Inactivo
                      </Dropdown.Item>
                    )}
                    {event.estado !== 'borrador' && (
                      <Dropdown.Item onClick={() => handleChangeState(event.id, 'borrador')}>
                        Marcar como Borrador
                      </Dropdown.Item>
                    )}
                  </Dropdown>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  );
};

export default ListEvents;