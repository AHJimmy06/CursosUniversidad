import React, { useState, useEffect } from 'react';
import { TextInput, Button, Label, Alert } from 'flowbite-react';
import { supabase } from '../../../utils/supabaseClient'; // Ajusta la ruta
import SearchResponsable from './SearchResponsable';
// PASO CLAVE: Importamos el tipo unificado
import { Evento } from '../../../types/eventos'; // Ajusta la ruta

interface EditEventFormProps {
  event: Evento; // Espera el tipo Evento correcto y completo
  onClose: () => void;
  onUpdate: () => void;
}

const EditEventForm: React.FC<EditEventFormProps> = ({ event, onClose, onUpdate }) => {
  const [nombre, setNombre] = useState(event.nombre);
  // El ID del responsable es el dato clave que vamos a actualizar
  const [responsableId, setResponsableId] = useState<string | null>(event.responsable_id);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincroniza el estado del formulario si el evento a editar cambia
  useEffect(() => {
    setNombre(event.nombre);
    setResponsableId(event.responsable_id);
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('Eventos')
        .update({
          nombre: nombre,
          responsable_id: responsableId, // Enviamos el ID (puede ser el original o el nuevo)
        })
        .eq('id', event.id);

      if (updateError) throw updateError;
      
      onUpdate(); // Llama al padre para que recargue y cierre. ¡Listo!

    } catch (err: any) {
      setError(`Error al actualizar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Obtenemos el nombre del responsable actual para mostrarlo
  const nombreResponsableActual = event.responsable 
    ? `${event.responsable.nombre1} ${event.responsable.apellido1}` 
    : 'Ninguno asignado';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert color="failure">{error}</Alert>}
      
      <div>
        <Label htmlFor="nombre" value="Nombre del Curso" />
        <TextInput
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>
      
      <div>
        {/* PASO CLAVE: Mostramos el responsable actual como texto simple */}
        <Label value="Responsable Actual" />
        <p className="text-sm p-2 bg-gray-100 rounded mt-1">{nombreResponsableActual}</p>
      </div>

      <div>
        <Label htmlFor="search-responsable" value="Cambiar Responsable (Opcional)" />
        <SearchResponsable
          onSelectResponsable={(id) => setResponsableId(id)}
        />
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button color="gray" onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button type="submit" isProcessing={loading}>Actualizar Evento</Button>
      </div>
    </form>
  );
};

export default EditEventForm;