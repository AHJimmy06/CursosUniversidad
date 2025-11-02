import React, { useState, useEffect } from 'react';
import { Button } from 'flowbite-react';
import { Estudiante } from '../../types/docente';
import { supabase } from '../../utils/supabaseClient';
import { useParams } from 'react-router-dom';
import ListEstudiantes from './ListEstudiantes';

const GestionEstudiantes: React.FC = () => {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const { cursoId } = useParams<{ cursoId: string }>();

  useEffect(() => {
    const fetchEstudiantes = async () => {
      if (!cursoId) return;

      setLoading(true);
      // 1. Obtener las inscripciones del curso
      const { data: inscripciones, error: errorInscripciones } = await supabase
        .from('inscripciones')
        .select('*')
        .eq('evento_id', cursoId);

      if (errorInscripciones) {
        console.error('Error al obtener las inscripciones:', errorInscripciones);
        setLoading(false);
        return;
      }

      // 2. Obtener los perfiles de los estudiantes
      const estudianteIds = inscripciones.map(inscripcion => inscripcion.usuario_id);
      const { data: perfiles, error: errorPerfiles } = await supabase
        .from('perfiles')
        .select('id, nombre1, apellido1, email')
        .in('id', estudianteIds);

      if (errorPerfiles) {
        console.error('Error al obtener los perfiles de los estudiantes:', errorPerfiles);
        setLoading(false);
        return;
      }

      // 3. Combinar la información
      const estudiantesData = inscripciones.map(inscripcion => {
        const perfil = perfiles.find(p => p.id === inscripcion.usuario_id);
        return {
          id: inscripcion.id,
          nombre: `${perfil?.nombre1} ${perfil?.apellido1}`,
          email: perfil?.email,
          curso: cursoId,
          notaFinal: inscripcion.nota_final,
          asistencia: inscripcion.asistencia,
        };
      });

      setEstudiantes(estudiantesData);
      setLoading(false);
    };

    fetchEstudiantes();
  }, [cursoId]);

  const handleNotaChange = (id: string, nota: string) => {
    const newEstudiantes = estudiantes.map(est =>
      est.id === id ? { ...est, notaFinal: parseFloat(nota) } : est
    );
    setEstudiantes(newEstudiantes);
  };

  const handleAsistenciaChange = (id: string, asistencia: string) => {
    const newEstudiantes = estudiantes.map(est =>
      est.id === id ? { ...est, asistencia: parseInt(asistencia) } : est
    );
    setEstudiantes(newEstudiantes);
  };

  const handleGuardarCambios = async () => {
    const updates = estudiantes.map(estudiante => {
      return supabase
        .from('inscripciones')
        .update({
          nota_final: estudiante.notaFinal,
          asistencia: estudiante.asistencia,
        })
        .eq('id', estudiante.id);
    });

    try {
      await Promise.all(updates);
      alert('Cambios guardados con éxito');
    } catch (error) {
      console.error('Error al guardar los cambios:', error);
      alert('Error al guardar los cambios');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Gestión de Estudiantes</h1>
      <ListEstudiantes
        estudiantes={estudiantes}
        loading={loading}
        onNotaChange={handleNotaChange}
        onAsistenciaChange={handleAsistenciaChange}
      />
      <Button color="blue" onClick={handleGuardarCambios} className="mt-4">
        Guardar Cambios
      </Button>
    </div>
  );
};

export default GestionEstudiantes;