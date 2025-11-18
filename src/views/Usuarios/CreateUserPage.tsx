import { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { UserProfile } from '../../types/user';
import { Alert, Button, TextInput, Select } from 'flowbite-react';

interface UserFormData extends Partial<UserProfile> {
  password?: string;
}

const CreateUserPage = () => {
  const [formData, setFormData] = useState<UserFormData>({
    nombre1: '',
    nombre2: '',
    apellido1: '',
    apellido2: '',
    cedula: '',
    telefono: '',
    email: '',
    fecha_nacimiento: '',
    password: '',
    rol: 'general',
    is_active: true,
  });
  const [alert, setAlert] = useState<{ type: 'success' | 'failure'; message: string } | null>(null);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email!,
        password: formData.password!,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('perfiles')
          .insert([{
            id: authData.user.id,
            nombre1: formData.nombre1,
            nombre2: formData.nombre2,
            apellido1: formData.apellido1,
            apellido2: formData.apellido2,
            cedula: formData.cedula,
            telefono: formData.telefono,
            email: formData.email,
            fecha_nacimiento: formData.fecha_nacimiento,
            rol: formData.rol,
            is_active: formData.is_active,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);

        if (profileError) throw profileError;
      }

      setAlert({ type: 'success', message: 'Usuario creado exitosamente' });
      // Reset form after successful creation
      setFormData({
        nombre1: '',
        nombre2: '',
        apellido1: '',
        apellido2: '',
        cedula: '',
        telefono: '',
        email: '',
        fecha_nacimiento: '',
        password: '',
        rol: 'general',
        is_active: true,
      });
    } catch (error: any) {
      console.error('Error saving user:', error);
      setAlert({ type: 'failure', message: error.message || 'Error al guardar usuario' });
    }
  };

  const handleInputChange = (field: keyof UserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Crear Nuevo Usuario</h1>
      </div>

      {alert && (
        <Alert color={alert.type === 'success' ? 'green' : 'red'} className="mb-4">
          {alert.message}
        </Alert>
      )}

      <form onSubmit={handleCreateSubmit} className="space-y-4">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <TextInput
            type="password"
            value={formData.password || ''}
            onChange={(e) => handleInputChange('password', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
          <Select
            value={formData.rol || 'general'}
            onChange={(e) => handleInputChange('rol', e.target.value)}
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
        <div className="flex justify-end">
          <Button type="submit" color="blue">
            Crear Usuario
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateUserPage;
