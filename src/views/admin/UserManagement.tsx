import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { UserProfile } from '../../types/user';
import { Button, Table, Modal, TextInput, Select, Alert } from 'flowbite-react';
import { IconUserPlus, IconEdit, IconTrash } from '@tabler/icons-react';

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [alert, setAlert] = useState<{ type: 'success' | 'failure'; message: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setAlert({ type: 'failure', message: 'Error al cargar usuarios' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      nombre1: '',
      nombre2: '',
      apellido1: '',
      apellido2: '',
      cedula: '',
      telefono: '',
      email: '',
      fecha_nacimiento: '',
      rol_usuario: 'general',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({ ...user });
    setShowModal(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;

    try {
      const { error } = await supabase
        .from('perfiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      setAlert({ type: 'success', message: 'Usuario eliminado exitosamente' });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setAlert({ type: 'failure', message: 'Error al eliminar usuario' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUser) {
        // Update user
        const { error } = await supabase
          .from('perfiles')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingUser.id);

        if (error) throw error;
        setAlert({ type: 'success', message: 'Usuario actualizado exitosamente' });
      } else {
        // Create user - Note: This would typically involve Supabase Auth
        // For now, we'll just create the profile
        const { error } = await supabase
          .from('perfiles')
          .insert([{
            ...formData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);

        if (error) throw error;
        setAlert({ type: 'success', message: 'Usuario creado exitosamente' });
      }

      setShowModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      setAlert({ type: 'failure', message: 'Error al guardar usuario' });
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        <Button onClick={handleCreate} color="blue">
          <IconUserPlus className="mr-2" />
          Nuevo Usuario
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
            <Table.HeadCell>Cédula</Table.HeadCell>
            <Table.HeadCell>Email</Table.HeadCell>
            <Table.HeadCell>Rol</Table.HeadCell>
            <Table.HeadCell>Estado</Table.HeadCell>
            <Table.HeadCell>Acciones</Table.HeadCell>
          </Table.Head>
          <Table.Body>
            {users.map((user) => (
              <Table.Row key={user.id}>
                <Table.Cell>
                  {user.nombre1} {user.nombre2} {user.apellido1} {user.apellido2}
                </Table.Cell>
                <Table.Cell>{user.cedula}</Table.Cell>
                <Table.Cell>{user.email}</Table.Cell>
                <Table.Cell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.rol_usuario === 'administrador'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.rol_usuario}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex space-x-2">
                    <Button size="sm" color="gray" onClick={() => handleEdit(user)}>
                      <IconEdit size={16} />
                    </Button>
                    <Button size="sm" color="failure" onClick={() => handleDelete(user.id)}>
                      <IconTrash size={16} />
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      <Modal show={showModal} onClose={() => setShowModal(false)}>
        <Modal.Header>
          {editingUser ? 'Editar Usuario' : 'Crear Usuario'}
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primer Nombre</label>
                <TextInput
                  value={formData.nombre1 || ''}
                  onChange={(e) => handleInputChange('nombre1', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Segundo Nombre</label>
                <TextInput
                  value={formData.nombre2 || ''}
                  onChange={(e) => handleInputChange('nombre2', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primer Apellido</label>
                <TextInput
                  value={formData.apellido1 || ''}
                  onChange={(e) => handleInputChange('apellido1', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Segundo Apellido</label>
                <TextInput
                  value={formData.apellido2 || ''}
                  onChange={(e) => handleInputChange('apellido2', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
                <TextInput
                  value={formData.cedula || ''}
                  onChange={(e) => handleInputChange('cedula', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <TextInput
                  value={formData.telefono || ''}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <TextInput
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
              <TextInput
                type="date"
                value={formData.fecha_nacimiento || ''}
                onChange={(e) => handleInputChange('fecha_nacimiento', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <Select
                value={formData.rol_usuario || 'general'}
                onChange={(e) => handleInputChange('rol_usuario', e.target.value)}
                required
              >
                <option value="general">General</option>
                <option value="administrador">Administrador</option>
              </Select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active || false}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="is_active">Usuario Activo</label>
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} color="blue">
            {editingUser ? 'Actualizar' : 'Crear'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserManagement;
