import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { EventWithResponsible, Event, UserProfile } from '../../types/user';
import { Button, Table, Modal, TextInput, Select, Textarea, Alert } from 'flowbite-react';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';

const EventManagement = () => {
  const [events, setEvents] = useState<EventWithResponsible[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<Partial<Event>>({});
  const [alert, setAlert] = useState<{ type: 'success' | 'failure'; message: string } | null>(null);

  useEffect(() => {
    fetchEvents();
    fetchUsers();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('eventos_con_responsable')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setAlert({ type: 'failure', message: 'Error al cargar eventos' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('id, nombre1, apellido1, cedula, email')
        .is('deleted_at', null)
        .eq('is_active', true);

      if (error) throw error;
      setUsers(data as UserProfile[] || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreate = () => {
    setEditingEvent(null);
    setFormData({
      nombre: '',
      descripcion: '',
      estado: 'borrador',
      tipo_evento: 'curso',
      fecha_inicio_evento: '',
      fecha_fin_evento: '',
      fecha_inicio_inscripcion: '',
      fecha_fin_inscripcion: '',
      es_pagado: false,
      costo: 0,
      genera_certificado: false,
      numero_horas: 0,
      nota_aprobacion: 70,
      audiencia: 'público_general',
    });
    setShowModal(true);
  };

  const handleEdit = async (event: EventWithResponsible) => {
    try {
      const { data, error } = await supabase
        .from('Eventos')
        .select('*')
        .eq('id', event.id)
        .single();

      if (error) throw error;

      setEditingEvent(data);
      setFormData(data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching event details:', error);
      setAlert({ type: 'failure', message: 'Error al cargar detalles del evento' });
    }
  };

  const handleDelete = async (eventId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este evento?')) return;

    try {
      const { error } = await supabase
        .from('Eventos')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setAlert({ type: 'success', message: 'Evento eliminado exitosamente' });
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      setAlert({ type: 'failure', message: 'Error al eliminar evento' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingEvent) {
        // Update event
        const { error } = await supabase
          .from('Eventos')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingEvent.id);

        if (error) throw error;
        setAlert({ type: 'success', message: 'Evento actualizado exitosamente' });
      } else {
        // Create event
        const { error } = await supabase
          .from('Eventos')
          .insert([{
            ...formData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);

        if (error) throw error;
        setAlert({ type: 'success', message: 'Evento creado exitosamente' });
      }

      setShowModal(false);
      fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      setAlert({ type: 'failure', message: 'Error al guardar evento' });
    }
  };

  const handleInputChange = (field: keyof Event, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Eventos con Responsable</h1>
        <Button onClick={handleCreate} color="blue">
          <IconPlus className="mr-2" />
          Nuevo Evento
        </Button>
      </div>

      {alert && (
        <Alert color={alert.type === 'success' ? 'green' : 'red'} className="mb-4">
          {alert.message}
        </Alert>
      )}

      <div className="overflow-x-auto">
        <Table>
          <Table.Head>
            <Table.HeadCell>Nombre</Table.HeadCell>
            <Table.HeadCell>Estado</Table.HeadCell>
            <Table.HeadCell>Responsable</Table.HeadCell>
            <Table.HeadCell>Cédula</Table.HeadCell>
            <Table.HeadCell>Acciones</Table.HeadCell>
          </Table.Head>
          <Table.Body>
            {events.map((event) => (
              <Table.Row key={event.id}>
                <Table.Cell>{event.nombre}</Table.Cell>
                <Table.Cell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    event.estado === 'activo'
                      ? 'bg-green-100 text-green-800'
                      : event.estado === 'inactivo'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {event.estado}
                  </span>
                </Table.Cell>
                <Table.Cell>{event.responsable_info.nombre} {event.responsable_info.apellido}</Table.Cell>
                <Table.Cell>{event.responsable_info.cedula}</Table.Cell>
                <Table.Cell>
                  <div className="flex space-x-2">
                    <Button size="sm" color="gray" onClick={() => handleEdit(event)}>
                      <IconEdit size={16} />
                    </Button>
                    <Button size="sm" color="failure" onClick={() => handleDelete(event.id)}>
                      <IconTrash size={16} />
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      <Modal show={showModal} onClose={() => setShowModal(false)} size="4xl">
        <Modal.Header>
          {editingEvent ? 'Editar Evento' : 'Crear Evento'}
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Evento</label>
                <TextInput
                  value={formData.nombre || ''}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <Select
                  value={formData.estado || 'borrador'}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                  required
                >
                  <option value="borrador">Borrador</option>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <Textarea
                value={formData.descripcion || ''}
                onChange={(e) => handleInputChange('descripcion', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Evento</label>
                <Select
                  value={formData.tipo_evento || 'curso'}
                  onChange={(e) => handleInputChange('tipo_evento', e.target.value)}
                  required
                >
                  <option value="curso">Curso</option>
                  <option value="congreso">Congreso</option>
                  <option value="conferencia">Conferencia</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Audiencia</label>
                <Select
                  value={formData.audiencia || 'público_general'}
                  onChange={(e) => handleInputChange('audiencia', e.target.value)}
                  required
                >
                  <option value="público_general">Público General</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
                <Select
                  value={formData.responsable_id || ''}
                  onChange={(e) => handleInputChange('responsable_id', e.target.value)}
                  required
                >
                  <option value="">Seleccionar Responsable</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nombre1} {user.apellido1} - {user.cedula}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Docente (Opcional)</label>
                <Select
                  value={formData.docente_id || ''}
                  onChange={(e) => handleInputChange('docente_id', e.target.value)}
                >
                  <option value="">Sin Docente</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nombre1} {user.apellido1} - {user.cedula}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio Evento</label>
                <TextInput
                  type="datetime-local"
                  value={formData.fecha_inicio_evento || ''}
                  onChange={(e) => handleInputChange('fecha_inicio_evento', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin Evento</label>
                <TextInput
                  type="datetime-local"
                  value={formData.fecha_fin_evento || ''}
                  onChange={(e) => handleInputChange('fecha_fin_evento', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio Inscripción</label>
                <TextInput
                  type="datetime-local"
                  value={formData.fecha_inicio_inscripcion || ''}
                  onChange={(e) => handleInputChange('fecha_inicio_inscripcion', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin Inscripción</label>
                <TextInput
                  type="datetime-local"
                  value={formData.fecha_fin_inscripcion || ''}
                  onChange={(e) => handleInputChange('fecha_fin_inscripcion', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="es_pagado"
                  checked={formData.es_pagado || false}
                  onChange={(e) => handleInputChange('es_pagado', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="es_pagado">Es Pagado</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Costo</label>
                <TextInput
                  type="number"
                  step="0.01"
                  value={formData.costo || 0}
                  onChange={(e) => handleInputChange('costo', parseFloat(e.target.value))}
                  disabled={!formData.es_pagado}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="genera_certificado"
                  checked={formData.genera_certificado || false}
                  onChange={(e) => handleInputChange('genera_certificado', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="genera_certificado">Genera Certificado</label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Horas</label>
                <TextInput
                  type="number"
                  value={formData.numero_horas || 0}
                  onChange={(e) => handleInputChange('numero_horas', parseInt(e.target.value))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nota de Aprobación</label>
                <TextInput
                  type="number"
                  step="0.01"
                  value={formData.nota_aprobacion || 70}
                  onChange={(e) => handleInputChange('nota_aprobacion', parseFloat(e.target.value))}
                  required
                />
              </div>
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} color="blue">
            {editingEvent ? 'Actualizar' : 'Crear'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EventManagement;
