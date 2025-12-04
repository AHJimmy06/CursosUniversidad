import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Table, Dropdown, Modal, Alert, Card, Label, TextInput, Select } from 'flowbite-react';
import EditEventForm from './componentesEventos/EditEventForm';
import { Evento } from '../../types/eventos';
import { useUser } from 'src/contexts/UserContext';

const ListEvents: React.FC = () => {
  const [events, setEvents] = useState<Evento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [responsibleFilter, setResponsibleFilter] = useState('');

  const { activeRole } = useUser();
  const isAdmin = activeRole === 'administrador';
  const isResponsible = activeRole === 'responsable';

  const fetchEventsAndResponsables = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('Eventos')
        .select('*, carreras(id, nombre)')
        .order('created_at', { ascending: false });

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

  const handleChangeState = async (eventId: number, newState: 'publicado' | 'inactivo' | 'borrador') => {
    if (window.confirm(`¿Estás seguro de que quieres cambiar el estado a "${newState}"?`)) {
      try {
        const { error } = await supabase
          .from('Eventos')
          .update({ estado: newState })
          .eq('id', eventId);

        if (error) throw error;

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

  const filteredEvents = events.filter(event => {
    const searchTermLower = searchTerm.toLowerCase();
    const responsibleFilterLower = responsibleFilter.toLowerCase();

    const matchesSearchTerm = event.nombre.toLowerCase().includes(searchTermLower);
    const matchesType = typeFilter ? event.tipo === typeFilter : true;
    const matchesResponsible =
      !responsibleFilter ||
      (event.responsable &&
        (`${event.responsable.nombre1} ${event.responsable.apellido1}`.toLowerCase().includes(responsibleFilterLower) ||
          event.responsable.cedula.includes(responsibleFilter)));

    return matchesSearchTerm && matchesType && matchesResponsible;
  });


  if (loading) return <p>Cargando eventos...</p>;
  if (error) return <Alert color="failure">Error al cargar datos: {error}</Alert>;

  return (
    <>
      <h2 className="text-2xl font-bold mb-4">Listado de Eventos</h2>
      <Card className="mb-6">
        <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          Filtros de Búsqueda
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search" value="Buscar por Nombre" />
            <TextInput
              id="search"
              type="text"
              placeholder="Buscar por nombre"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="type" value="Filtrar por Tipo" />
            <Select id="type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">Todos los tipos</option>
              <option value="curso">Curso</option>
              <option value="conferencia">Conferencia</option>
              <option value="congreso">Congreso</option>
              <option value="webinar">Webinar</option>
              <option value="socializacion">Socialización</option>
              <option value="otro">Otro</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="responsible" value="Buscar por Responsable" />
            <TextInput
              id="responsible"
              type="text"
              placeholder="Buscar por responsable"
              value={responsibleFilter}
              onChange={(e) => setResponsibleFilter(e.target.value)}
            />
          </div>
        </div>
      </Card>
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

      {filteredEvents.length === 0 ? (
        <p>No hay eventos disponibles.</p>
      ) : (
        <Table>
          <Table.Head>
            <Table.HeadCell>Nombre del Evento</Table.HeadCell>
            <Table.HeadCell>Responsable</Table.HeadCell>
            <Table.HeadCell>Cédula/Pasaporte</Table.HeadCell>
            <Table.HeadCell>Estado</Table.HeadCell>
            <Table.HeadCell>Acciones<span className="sr-only">Acciones</span></Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {filteredEvents.map((event) => (
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
                  <Dropdown inline label="Acciones">
                    {(isAdmin || (isResponsible && event.estado === 'borrador')) && (
                      <Dropdown.Item onClick={() => handleEdit(event)}>
                        Editar
                      </Dropdown.Item>
                    )}

                    {event.estado !== 'publicado' && (
                      <Dropdown.Item onClick={() => handleChangeState(event.id, 'publicado')}>
                        Marcar como Publicado
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
    </>
  );
};

export default ListEvents;