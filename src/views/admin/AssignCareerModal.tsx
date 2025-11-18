import { useEffect, useState } from 'react';
import { supabase } from 'src/utils/supabaseClient';
import { Modal, Button, Checkbox, Label, Spinner, Alert } from 'flowbite-react';

interface AssignCareerModalProps {
  isOpen: boolean;
  onClose: (shouldRefresh: boolean) => void;
  userId: string | null;
}

interface Carrera {
  id: number;
  nombre: string;
}

const AssignCareerModal = ({ isOpen, onClose, userId }: AssignCareerModalProps) => {
  const [careers, setCareers] = useState<Carrera[]>([]);
  const [selectedCareers, setSelectedCareers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset state on open
      setSelectedCareers([]);
      setError(null);
      
      const fetchCareers = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase.from('carreras').select('id, nombre');
          if (error) throw error;
          setCareers(data || []);
        } catch (err: any) {
          setError('Error al cargar las carreras: ' + err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchCareers();
    }
  }, [isOpen]);

  const handleCheckboxChange = (careerId: number) => {
    setSelectedCareers(prev =>
      prev.includes(careerId)
        ? prev.filter(id => id !== careerId)
        : [...prev, careerId]
    );
  };

  const handleSave = async () => {
    if (!userId) return;
    if (selectedCareers.length === 0) {
      setError('Debes seleccionar al menos una carrera.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use a transaction to ensure atomicity
      const { error: transactionError } = await supabase.rpc('assign_user_careers', {
        p_user_id: userId,
        p_career_ids: selectedCareers
      });

      if (transactionError) throw transactionError;

      // Update user's verification status
      const { error: updateError } = await supabase
        .from('perfiles')
        .update({ estado_verificacion: 'verificado' })
        .eq('id', userId);

      if (updateError) throw updateError;

      onClose(true); // Close modal and trigger refresh
    } catch (err: any) {
      setError('Error al guardar los cambios: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={() => onClose(false)}>
      <Modal.Header>Asignar Carreras al Usuario</Modal.Header>
      <Modal.Body>
        {error && <Alert color="failure" className="mb-4">{error}</Alert>}
        {loading && !careers.length ? (
          <div className="flex justify-center"><Spinner /></div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-gray-600 dark:text-gray-400">
              Selecciona las carreras a las que pertenece el usuario. Esto le dará acceso a los eventos restringidos correspondientes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {careers.map(career => (
                <Label key={career.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Checkbox
                    id={`career-${career.id}`}
                    value={career.id}
                    checked={selectedCareers.includes(career.id)}
                    onChange={() => handleCheckboxChange(career.id)}
                  />
                  {career.nombre}
                </Label>
              ))}
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button color="primary" onClick={handleSave} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
        <Button color="gray" onClick={() => onClose(false)} disabled={loading}>
          Cancelar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// IMPORTANT: The `assign_user_careers` RPC function needs to be created in Supabase SQL editor:
/*
CREATE OR REPLACE FUNCTION assign_user_careers(p_user_id uuid, p_career_ids int[])
RETURNS void AS $$
BEGIN
  -- First, delete existing career associations for the user
  DELETE FROM public.perfiles_carreras WHERE usuario_id = p_user_id;

  -- Then, insert the new ones
  IF array_length(p_career_ids, 1) > 0 THEN
    INSERT INTO public.perfiles_carreras (usuario_id, carrera_id)
    SELECT p_user_id, unnest(p_career_ids);
  END IF;
END;
$$ LANGUAGE plpgsql;
*/

export default AssignCareerModal;
