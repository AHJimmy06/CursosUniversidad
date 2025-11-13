import { useEffect, useState } from 'react';
import { UserProfile } from 'src/types/user';
import { Button, Modal, TextInput, Select, Checkbox, Label, Spinner } from 'flowbite-react';
import { supabase } from 'src/utils/supabaseClient';

interface UserFormData extends Partial<UserProfile> {
  password?: string;
}

interface Carrera {
  id: number;
  nombre: string;
}

interface EditUserProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: UserFormData;
  setFormData: React.Dispatch<React.SetStateAction<UserFormData>>;
  handleInputChange: (field: keyof UserFormData, value: any) => void;
  editingUser: UserProfile | null;
  selectedCareers: number[];
  onCareerChange: (careerId: number) => void;
}

const EditUser = ({ 
  show, 
  onClose, 
  onSubmit, 
  formData, 
  handleInputChange, 
  selectedCareers,
  onCareerChange
}: EditUserProps) => {
  const [allCareers, setAllCareers] = useState<Carrera[]>([]);
  const [loadingCareers, setLoadingCareers] = useState(false);

  useEffect(() => {
    if (show) {
      setLoadingCareers(true);
      supabase
        .from('carreras')
        .select('id, nombre')
        .then(({ data, error }) => {
          if (!error && data) {
            setAllCareers(data);
          }
          setLoadingCareers(false);
        });
    }
  }, [show]);

  return (
    <Modal show={show} onClose={onClose}>
      <Modal.Header>Editar Usuario</Modal.Header>
      <Modal.Body>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* --- CAMPOS DE TEXTO EXISTENTES --- */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primer Nombre</label>
              <TextInput value={formData.nombre1 || ''} onChange={(e) => handleInputChange('nombre1', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Segundo Nombre</label>
              <TextInput value={formData.nombre2 || ''} onChange={(e) => handleInputChange('nombre2', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primer Apellido</label>
              <TextInput value={formData.apellido1 || ''} onChange={(e) => handleInputChange('apellido1', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Segundo Apellido</label>
              <TextInput value={formData.apellido2 || ''} onChange={(e) => handleInputChange('apellido2', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
              <TextInput value={formData.cedula || ''} onChange={(e) => handleInputChange('cedula', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <TextInput value={formData.telefono || ''} onChange={(e) => handleInputChange('telefono', e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <TextInput type="email" value={formData.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
            <TextInput type="date" value={formData.fecha_nacimiento || ''} onChange={(e) => handleInputChange('fecha_nacimiento', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <Select value={formData.rol || 'general'} onChange={(e) => handleInputChange('rol', e.target.value)} required>
              <option value="general">General</option>
              <option value="administrador">Administrador</option>
            </Select>
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="is_active" checked={formData.is_active || false} onChange={(e) => handleInputChange('is_active', e.target.checked)} className="mr-2" />
            <label htmlFor="is_active">Usuario Activo</label>
          </div>

          {/* --- NUEVA SECCIÓN DE CARRERAS --- */}
          <hr className="my-4" />
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Carreras Verificadas</h3>
            {loadingCareers ? <Spinner /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {allCareers.map(career => (
                  <Label key={career.id} className="flex items-center gap-2 p-2 rounded-lg">
                    <Checkbox
                      id={`career-${career.id}`}
                      checked={selectedCareers.includes(career.id)}
                      onChange={() => onCareerChange(career.id)}
                    />
                    {career.nombre}
                  </Label>
                ))}
              </div>
            )}
          </div>
        </form>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={onSubmit} color="blue">
          Actualizar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditUser;
