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

interface CdcRole {
  id: number;
  nombre_rol: string;
  descripcion: string;
}

interface EditUserProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: UserFormData;
  // Cambiado: quitamos el tipo específico de setFormData porque no lo usas directamente aquí
  // y hace más difícil reutilizar el componente.
  setFormData: any; 
  handleInputChange: (field: keyof UserFormData, value: any) => void;
  editingUser: UserProfile | null;
  selectedCareers: number[];
  onCareerChange: (careerId: number) => void;
  allCdcRoles: CdcRole[];
  selectedCdcRoles: number[];
  onCdcRoleChange: (roleId: number) => void;
}

const EditUser = ({ 
  show, 
  onClose, 
  onSubmit, 
  formData, 
  handleInputChange, 
  selectedCareers,
  onCareerChange,
  allCdcRoles,
  selectedCdcRoles,
  onCdcRoleChange
}: EditUserProps) => {
  const [allCareers, setAllCareers] = useState<Carrera[]>([]);
  const [loadingCareers, setLoadingCareers] = useState(false);
  const [careersLoaded, setCareersLoaded] = useState(false); // Cache simple

  useEffect(() => {
    // Solo cargamos si se muestra el modal Y no se han cargado antes
    if (show && !careersLoaded) {
      let isActive = true; // Bandera anti-fuga de memoria

      const fetchCareers = async () => {
        try {
          setLoadingCareers(true);
          const { data, error } = await supabase
            .from('carreras')
            .select('id, nombre');
          
          if (!isActive) return; // Si cerramos antes de terminar, cancelamos

          if (!error && data) {
            setAllCareers(data);
            setCareersLoaded(true); // Marcamos como cargado para no repetir
          }
        } catch (error) {
          console.error("Error loading careers", error);
        } finally {
          if (isActive) setLoadingCareers(false);
        }
      };

      fetchCareers();

      return () => {
        isActive = false;
      };
    }
  }, [show, careersLoaded]); // Dependencias corregidas

  return (
    <Modal show={show} onClose={onClose} size="xl"> {/* Añadido size="xl" para mejor layout */}
      <Modal.Header>Editar Usuario</Modal.Header>
      <Modal.Body>
        <form id="edit-user-form" onSubmit={onSubmit} className="space-y-4">
          {/* --- CAMPOS DE TEXTO --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Responsive grid */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Primer Nombre</label>
              <TextInput value={formData.nombre1 || ''} onChange={(e) => handleInputChange('nombre1', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Segundo Nombre</label>
              <TextInput value={formData.nombre2 || ''} onChange={(e) => handleInputChange('nombre2', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Primer Apellido</label>
              <TextInput value={formData.apellido1 || ''} onChange={(e) => handleInputChange('apellido1', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Segundo Apellido</label>
              <TextInput value={formData.apellido2 || ''} onChange={(e) => handleInputChange('apellido2', e.target.value)} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cédula</label>
              <TextInput value={formData.cedula || ''} onChange={(e) => handleInputChange('cedula', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
              <TextInput value={formData.telefono || ''} onChange={(e) => handleInputChange('telefono', e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <TextInput type="email" value={formData.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Nacimiento</label>
                <TextInput type="date" value={formData.fecha_nacimiento || ''} onChange={(e) => handleInputChange('fecha_nacimiento', e.target.value)} required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol del Sistema</label>
                <Select value={formData.rol || 'general'} onChange={(e) => handleInputChange('rol', e.target.value)} required>
                <option value="general">General</option>
                <option value="administrador">Administrador</option>
                </Select>
            </div>
          </div>

          <div className="flex items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <Checkbox id="is_active" checked={formData.is_active || false} onChange={(e) => handleInputChange('is_active', e.target.checked)} className="mr-2" />
            <Label htmlFor="is_active">Usuario Activo (Acceso Permitido)</Label>
          </div>

          {/* --- SECCIÓN DE CARRERAS --- */}
          <hr className="my-4 border-gray-200 dark:border-gray-600" />
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Carreras Verificadas</h3>
            {loadingCareers ? (
                <div className="flex justify-center p-4"><Spinner /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 border rounded dark:border-gray-600">
                {allCareers.map(career => (
                  <div key={career.id} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <Checkbox
                      id={`career-${career.id}`}
                      checked={selectedCareers.includes(career.id)}
                      onChange={() => onCareerChange(career.id)}
                    />
                    <Label htmlFor={`career-${career.id}`} className="cursor-pointer">{career.nombre}</Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* --- SECCIÓN DE ROLES DEL CDC --- */}
          <hr className="my-4 border-gray-200 dark:border-gray-600" />
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Roles del Módulo de Cambios (CDC)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded dark:border-gray-600 p-2">
              {allCdcRoles.length > 0 ? (
                allCdcRoles.map(role => (
                    <div key={role.id} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title={role.descripcion}>
                    <Checkbox
                        id={`cdc-role-${role.id}`}
                        checked={selectedCdcRoles.includes(role.id)}
                        onChange={() => onCdcRoleChange(role.id)}
                    />
                    <Label htmlFor={`cdc-role-${role.id}`} className="cursor-pointer">
                        {role.nombre_rol}
                    </Label>
                    </div>
                ))
              ) : (
                  <p className="text-sm text-gray-500 p-2">No hay roles CDC definidos.</p>
              )}
            </div>
          </div>
        </form>
      </Modal.Body>
      <Modal.Footer>
        <Button color="gray" onClick={onClose}>
            Cancelar
        </Button>
        {/* Vinculamos el botón al formulario usando form="id" */}
        <Button type="submit" form="edit-user-form" color="blue">
          Guardar Cambios
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditUser;