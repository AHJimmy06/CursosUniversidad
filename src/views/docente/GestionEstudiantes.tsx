import React, { useState, useEffect } from 'react';
import { Button, Table, Spinner, Alert, TextInput } from 'flowbite-react';
import { supabase } from '../../utils/supabaseClient';
import { useParams } from 'react-router-dom';
import { HiInformationCircle } from 'react-icons/hi';
import { useModal } from '../../contexts/ModalContext';

type EstudianteGestion = {
  id: number; // id de inscripcion
  nombre: string;
  email: string;
  curso: string;
  notaFinal: number | null;
  asistencia: number | null;
};

const GestionEstudiantes: React.FC = () => {
  const [estudiantes, setEstudiantes] = useState<EstudianteGestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventoNombre, setEventoNombre] = useState<string>('');
  const { cursoId } = useParams<{ cursoId: string }>();
  const { showModal } = useModal();

  useEffect(() => {
    const fetchEstudiantes = async () => {
      if (!cursoId) return;

      setLoading(true);
      setError(null);
      try {
        const { data: evento, error: eventoError } = await supabase
          .from('Eventos')
          .select('id, nombre')
          .eq('id', Number(cursoId))
          .single();
        if (eventoError) {
          console.warn('No se pudo obtener el nombre del curso', eventoError);
        }
        const nombreCurso = (evento as any)?.nombre ?? String(cursoId);
        setEventoNombre(nombreCurso);

        const { data: inscripciones, error: errorInscripciones } = await supabase
          .from('inscripciones')
          .select('*')
          .eq('evento_id', Number(cursoId));

        if (errorInscripciones) throw errorInscripciones;

        const estudianteIds = (inscripciones || []).map((i: any) => i.usuario_id);

        const { data: perfiles, error: errorPerfiles } = await supabase
          .from('perfiles')
          .select('id, nombre1, apellido1, email')
          .in('id', estudianteIds);

        if (errorPerfiles) throw errorPerfiles;

        const estudiantesData: EstudianteGestion[] = (inscripciones || []).map((inscripcion: any) => {
          const perfil = (perfiles || []).find((p: any) => p.id === inscripcion.usuario_id);
          return {
            id: inscripcion.id,
            nombre: `${perfil?.nombre1 ?? ''} ${perfil?.apellido1 ?? ''}`.trim(),
            email: perfil?.email ?? '',
            curso: nombreCurso,
            notaFinal: inscripcion.nota_final,
            asistencia: inscripcion.asistencia,
          };
        });

        setEstudiantes(estudiantesData);
      } catch (err: any) {
        setError(err.message || 'Error al cargar datos');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEstudiantes();
  }, [cursoId]);

  const handleNotaChange = (id: number, nota: string) => {
    const value = nota === '' ? null : Number(nota);
    const newEstudiantes = estudiantes.map(est =>
      est.id === id ? { ...est, notaFinal: Number.isNaN(value as number) ? null : (value as number) } : est
    );
    setEstudiantes(newEstudiantes);
  };

  const handleAsistenciaChange = (id: number, asistencia: string) => {
    const value = asistencia === '' ? null : Number(parseInt(asistencia));
    const newEstudiantes = estudiantes.map(est =>
      est.id === id ? { ...est, asistencia: Number.isNaN(value as number) ? null : (value as number) } : est
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
      showModal({
        title: 'Éxito',
        body: 'Los cambios en las notas y asistencias se han guardado correctamente.',
        showCancel: false,
        confirmText: 'Entendido',
      });
    } catch (error) {
      console.error('Error al guardar los cambios:', error);
      showModal({
        title: 'Error',
        body: 'No se pudieron guardar los cambios. Por favor, inténtalo de nuevo.',
        showCancel: false,
        confirmText: 'Cerrar',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="mb-4">
        <h1 className="text-3xl font-bold">Gestión de Estudiantes</h1>
        {eventoNombre && (
          <p className="text-gray-600 mt-1">Curso: <span className="font-medium">{eventoNombre}</span></p>
        )}
      </div>
      {error && <Alert color="failure" icon={HiInformationCircle} className="mb-4">{error}</Alert>}
      <Table hoverable>
        <Table.Head>
          <Table.HeadCell>Estudiante</Table.HeadCell>
          <Table.HeadCell>Email</Table.HeadCell>
          <Table.HeadCell>Curso</Table.HeadCell>
          <Table.HeadCell>Nota Final</Table.HeadCell>
          <Table.HeadCell>Asistencia (%)</Table.HeadCell>
        </Table.Head>
        <Table.Body className="divide-y">
          {estudiantes.map((est) => (
            <Table.Row key={est.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
              <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                {est.nombre}
              </Table.Cell>
              <Table.Cell>{est.email}</Table.Cell>
              <Table.Cell>{est.curso}</Table.Cell>
              <Table.Cell>
                <TextInput
                  type="number"
                  value={est.notaFinal ?? ''}
                  onChange={(e) => handleNotaChange(est.id, e.target.value)}
                  className="w-24"
                />
              </Table.Cell>
              <Table.Cell>
                <TextInput
                  type="number"
                  value={est.asistencia ?? ''}
                  onChange={(e) => handleAsistenciaChange(est.id, e.target.value)}
                  className="w-24"
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <Button color="blue" onClick={handleGuardarCambios} className="mt-4">
        Guardar Cambios (Notas/Asistencia)
      </Button>
    </div>
  );
};

export default GestionEstudiantes;
