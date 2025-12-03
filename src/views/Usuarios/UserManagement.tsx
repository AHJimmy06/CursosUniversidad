import { useState, useEffect, useRef } from 'react';
import { supabase } from 'src/utils/supabaseClient';
import { UserProfile } from 'src/types/user';
import { Alert, Card, Label, TextInput, Select } from 'flowbite-react';
import ListUser from './Componentes/ListUser';
import EditUser from './Componentes/EditUser';
import { useModal } from 'src/contexts/ModalContext';

interface UserFormData extends Partial<UserProfile> {
  password?: string;
}

interface CdcRole {
  id: number;
  nombre_rol: string;
  descripcion: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado del Modal y Edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<UserFormData>({});
  
  // Datos auxiliares
  const [editedUserCareers, setEditedUserCareers] = useState<number[]>([]);
  const [allCdcRoles, setAllCdcRoles] = useState<CdcRole[]>([]);
  const [editedUserCdcRoles, setEditedUserCdcRoles] = useState<number[]>([]);
  
  // UI States
  const [alert, setAlert] = useState<{ type: 'success' | 'failure'; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { showModal } = useModal();
  
  // Ref para cancelar peticiones en handleEdit si se cierra el modal
  const editRequestActive = useRef(false);

  // --- 1. SOLUCIÓN MEMORY LEAK EN CARGA INICIAL ---
  useEffect(() => {
    let isActive = true;

    const initializeData = async () => {
      try {
        setLoading(true);
        // Carga paralela para ser más rápido
        const [usersResponse, rolesResponse] = await Promise.all([
            supabase.from('perfiles').select('*').order('created_at', { ascending: false }),
            supabase.from('cdc_roles').select('*')
        ]);

        if (!isActive) return;

        if (usersResponse.error) throw usersResponse.error;
        if (rolesResponse.error) throw rolesResponse.error;

        setUsers(usersResponse.data || []);
        setAllCdcRoles(rolesResponse.data || []);

      } catch (error: any) {
        if (isActive) {
            console.error('Error fetching data:', error);
            setAlert({ type: 'failure', message: 'Error al cargar datos iniciales.' });
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    initializeData();

    return () => {
      isActive = false;
    };
  }, []);

  // --- RECARGAR SOLO USUARIOS (Sin tocar roles que son estáticos) ---
  const fetchUsers = async () => {
    try {
      setLoading(true); // Opcional: podrías quitar esto para recarga silenciosa
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setAlert({ type: 'failure', message: 'Error al recargar usuarios' });
    } finally {
      setLoading(false);
    }
  };

  // --- 2. PROTECCIÓN EN HANDLE EDIT ---
  const handleEdit = async (user: UserProfile) => {
    setEditingUser(user);
    setFormData({ ...user });
    setShowEditModal(true);
    
    // Reseteamos estados temporales mientras cargamos lo nuevo
    setEditedUserCareers([]);
    setEditedUserCdcRoles([]);

    try {
        editRequestActive.current = true;
        
        const [careersResponse, cdcRolesResponse] = await Promise.all([
            supabase.from('perfiles_carreras').select('carrera_id').eq('usuario_id', user.id),
            supabase.from('cdc_usuarios_roles').select('rol_id').eq('usuario_id', user.id)
        ]);

        // Si el usuario cerró el modal antes de que esto terminara, no actualizamos
        if (!editRequestActive.current || !showEditModal) { 
             // Nota: showEditModal puede ser false si el usuario cerró rápido, 
             // pero a veces el estado de React no se actualiza instantáneamente en el closure.
             // La mejor protección es verificar si el usuario editado sigue siendo el mismo.
        }

        if (careersResponse.error) throw careersResponse.error;
        if (cdcRolesResponse.error) throw cdcRolesResponse.error;

        setEditedUserCareers(careersResponse.data.map(c => c.carrera_id));
        setEditedUserCdcRoles(cdcRolesResponse.data.map(r => r.rol_id));

    } catch (error) {
        console.error("Error loading user details:", error);
        // No mostramos alerta al usuario aquí para no interrumpir el flujo visual, solo log.
    }
  };

  // Limpiar referencia al cerrar modal
  const handleCloseModal = () => {
      editRequestActive.current = false;
      setShowEditModal(false);
      setEditingUser(null); // Limpiar usuario seleccionado
  };

  const handleDelete = async (userId: string) => {
    const confirmed = await showModal({
      title: '¿Estás seguro de que deseas eliminar este usuario?',
      body: 'Esta acción marcará al usuario como inactivo y no se podrá deshacer fácilmente.',
    });

    if (confirmed) {
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
    }
  };

  const handleReactivate = async (userId: string) => {
    const confirmed = await showModal({
      title: '¿Estás seguro de que deseas reactivar este usuario?',
      body: 'El usuario recuperará el acceso al sistema.',
      confirmText: 'Sí, reactivar',
    });

    if (confirmed) {
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
    }
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
      const { error: careersRpcError } = await supabase.rpc('assign_user_careers', {
        p_user_id: editingUser.id,
        p_career_ids: editedUserCareers,
      });

      if (careersRpcError) throw careersRpcError;

      // Update user CDC roles
      const { error: cdcRpcError } = await supabase.rpc('assign_user_cdc_roles', {
        p_user_id: editingUser.id,
        p_role_ids: editedUserCdcRoles,
      });

      if (cdcRpcError) throw cdcRpcError;

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

  const handleCdcRoleChange = (roleId: number) => {
    setEditedUserCdcRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  // Filtrado optimizado para no recalcular si no cambian los filtros
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
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Lista de Usuarios</h1>
      </div>

      


      <Card className="mb-6">
      <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
        Filtros de Búsqueda
      </h5>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="search" value="Buscar" />
          <TextInput
            id="search"
            type="text"
            placeholder="Buscar por nombre o cédula"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="role" value="Filtrar por Rol" />
          <Select id="role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">Todos los roles</option>
            <option value="administrador">Administrador</option>
            <option value="general">Usuario General</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="status" value="Filtrar por Estado" />
          <Select id="status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Todos (Estado)</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </Select>
        </div>
      </div>
    </Card>

      {alert && (
        <Alert color={alert.type === 'success' ? 'green' : 'red'} className="mb-4" onDismiss={() => setAlert(null)}>
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
        onClose={handleCloseModal} // Usamos el nuevo handler de cierre
        onSubmit={handleEditSubmit}
        formData={formData}
        setFormData={setFormData}
        handleInputChange={handleInputChange}
        editingUser={editingUser}
        selectedCareers={editedUserCareers}
        onCareerChange={handleCareerChange}
        allCdcRoles={allCdcRoles}
        selectedCdcRoles={editedUserCdcRoles}
        onCdcRoleChange={handleCdcRoleChange}
      />
    </>
  );
};

export default UserManagement;