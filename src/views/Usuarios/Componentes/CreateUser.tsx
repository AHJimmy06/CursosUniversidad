import { UserProfile } from '../../../types/user';
import { Button, Modal, TextInput, Select } from 'flowbite-react';

interface UserFormData extends Partial<UserProfile> {
  password?: string;
}

interface CreateUserProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: UserFormData;
  setFormData: React.Dispatch<React.SetStateAction<UserFormData>>;
  handleInputChange: (field: keyof UserFormData, value: any) => void;
}

const CreateUser = ({ show, onClose, onSubmit, formData, setFormData, handleInputChange }: CreateUserProps) => {
  return (
    <Modal show={show} onClose={onClose}>
      <Modal.Header>Crear Usuario</Modal.Header>
      <Modal.Body>
        <form onSubmit={onSubmit} className="space-y-4">
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
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={onSubmit} color="blue">
          Crear
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateUser;
