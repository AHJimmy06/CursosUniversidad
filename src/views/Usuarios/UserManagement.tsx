import { useState, useEffect } from 'react';
import { supabase } from 'src/utils/supabaseClient';
import { UserProfile } from 'src/types/user';
import { Alert } from 'flowbite-react';
import ListUser from './Componentes/ListUser';
import EditUser from './Componentes/EditUser';

interface UserFormData extends Partial<UserProfile> {
  password?: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<UserFormData>({});
  const [editedUserCareers, setEditedUserCareers] = useState<number[]>([]);
  const [alert, setAlert] = useState<{ type: 'success' | 'failure'; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
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

  const handleEdit = async (user: UserProfile) => {
    setEditingUser(user);
    setFormData({ ...user });

    // Fetch user's current careers
    const { data, error } = await supabase
      .from('perfiles_carreras')
      .select('carrera_id')
      .eq('usuario_id', user.id);
    
    if (error) {
      console.error("Error fetching user's careers:", error);
      setEditedUserCareers([]);
    } else {
      setEditedUserCareers(data.map(c => c.carrera_id));
    }

    setShowEditModal(true);
  };

  import { useModal } from 'src/contexts/ModalContext';

// ... (dentro del componente UserManagement)
  const { showModal } = useModal();

  const handleDelete = (userId: string) => {
    showModal({
      title: '¿Estás seguro de que deseas eliminar este usuario?',
      body: 'Esta acción marcará al usuario como inactivo y no se podrá deshacer fácilmente.',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('perfiles')
            .update({ deleted_at: new Date().toISOString(), is_active: false })
            .eq('id', userId);

          if (error) throw error;

          setAlert({ type: 'success', message: 'Usuario eliminado exitosamente' });
          fetchUsers();
        } catch (error) {
          console.error('Error deleting user:', error);
          setAlert({ type: 'failure', message: 'Error al eliminar usuario' });
        }
      },
    });
  };

  const handleReactivate = (userId: string) => {
    showModal({
      title: '¿Estás seguro de que deseas reactivar este usuario?',
      body: 'El usuario recuperará el acceso al sistema.',
      confirmText: 'Sí, reactivar',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('perfiles')
            .update({ deleted_at: null, is_active: true })
            .eq('id', userId);

          if (error) throw error;

          setAlert({ type: 'success', message: 'Usuario reactivado exitosamente' });
          fetchUsers();
        } catch (error) {
          console.error('Error reactivating user:', error);
          setAlert({ type: 'failure', message: 'Error al reactivar usuario' });
        }
      },
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingUser) return;

    try {
      // Update user profile data
      const { error: profileError } = await supabase
        .from('perfiles')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingUser.id);

      if (profileError) throw profileError;

      // Update user careers
      const { error: rpcError } = await supabase.rpc('assign_user_careers', {
        p_user_id: editingUser.id,
        p_career_ids: editedUserCareers,
      });

      if (rpcError) throw rpcError;

      // FIX: Update verification status based on career assignment
      const newStatus = editedUserCareers.length > 0 ? 'verificado' : 'no_solicitado';
      const { error: statusError } = await supabase
        .from('perfiles')
        .update({ estado_verificacion: newStatus })
        .eq('id', editingUser.id);

      if (statusError) throw statusError;


      setAlert({ type: 'success', message: 'Usuario actualizado exitosamente' });
      setShowEditModal(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error saving user:', error);
      setAlert({ type: 'failure', message: error.message || 'Error al guardar usuario' });
    }
  };

  const handleInputChange = (field: keyof UserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCareerChange = (careerId: number) => {
    setEditedUserCareers(prev =>
      prev.includes(careerId)
        ? prev.filter(id => id !== careerId)
        : [...prev, careerId]
    );
  };

  const filteredUsers = users.filter(user => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearchTerm =
      (user.nombre1 && user.nombre1.toLowerCase().includes(searchTermLower)) ||
      (user.apellido1 && user.apellido1.toLowerCase().includes(searchTermLower)) ||
      (user.cedula && user.cedula.toLowerCase().includes(searchTermLower));

    const matchesRole = roleFilter ? user.rol === roleFilter : true;

    const userIsActive = user.is_active;
    const matchesStatus = statusFilter ? (statusFilter === 'active' ? userIsActive : !userIsActive) : true;

    return matchesSearchTerm && matchesRole && matchesStatus;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lista de Usuarios</h1>
      </div>

      <div className="flex justify-between items-center mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre o cédula"
          className="border p-2 rounded"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select
          className="border p-2 rounded"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="">Todos los roles</option>
          <option value="administrador">Administrador</option>
          <option value="general">Usuario General</option>
        </select>
        <select
          className="border p-2 rounded"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </div>

      {alert && (
        <Alert color={alert.type === 'success' ? 'green' : 'red'} className="mb-4">
          {alert.message}
        </Alert>
      )}

      <ListUser
        users={filteredUsers}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReactivate={handleReactivate}
      />

      <EditUser
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditSubmit}
        formData={formData}
        setFormData={setFormData}
        handleInputChange={handleInputChange}
        editingUser={editingUser}
        selectedCareers={editedUserCareers}
        onCareerChange={handleCareerChange}
      />
    </div>
  );
};

export default UserManagement;
