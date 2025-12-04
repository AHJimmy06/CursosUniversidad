import React, { useState, useEffect } from 'react';
import { Button, Table, Spinner, Alert, TextInput, Tooltip } from 'flowbite-react';
import { supabase } from '../../utils/supabaseClient';
import { useParams } from 'react-router-dom';
import { HiInformationCircle, HiPrinter } from 'react-icons/hi';
import { useModal } from '../../contexts/ModalContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Evento } from '../../types/eventos';

type EstudianteGestion = {
  id: number; // id de inscripcion
  nombre: string;
  email: string;
  notaFinal: number | null;
  asistencia: number | null;
};

const GestionEstudiantes: React.FC = () => {
  const [estudiantes, setEstudiantes] = useState<EstudianteGestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [eventoNombre, setEventoNombre] = useState<string>('');
  const { cursoId } = useParams<{ cursoId: string }>();
  const { showModal } = useModal();

  useEffect(() => {
    const fetchEstudiantes = async () => {
      if (!cursoId) return;

      setLoading(true);
      setError(null);
      try {
        const { data: eventoData, error: eventoError } = await supabase
          .from('Eventos')
          .select(`
            *,
            responsable:perfiles!responsable_id(id, nombre1, apellido1),
            docente:perfiles!docente_id(id, nombre1, apellido1)
          `)
          .eq('id', Number(cursoId))
          .single();
        
        if (eventoError) throw eventoError;

        setEvento(eventoData);
        setEventoNombre(eventoData?.nombre ?? String(cursoId));

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

  const handleGenerarReporte = () => {
    console.log('Iniciando generación de reporte...');
    console.log('Datos del evento:', evento);
    console.log('Datos de estudiantes:', estudiantes);

    if (!evento) {
      console.error('Error: No se encontraron datos del evento para generar el reporte.');
      return;
    }

    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text(`Reporte de Calificaciones: ${evento.nombre}`, 14, 22);

    // Sub-encabezado con detalles del curso
    doc.setFontSize(11);
    doc.setTextColor(100);
    const headerText = `
      Fecha de finalización: ${new Date(evento.fecha_fin_evento || '').toLocaleDateString()}
      Docente: ${evento.docente?.nombre1} ${evento.docente?.apellido1}
      Responsable: ${evento.responsable?.nombre1} ${evento.responsable?.apellido1}
    `;
    doc.text(headerText.trim(), 14, 32);

    // Definir las columnas y filas para la tabla
    const head = [['Estudiante', 'Email', 'Nota Final', 'Asistencia (%)']];
    const body = estudiantes.map(e => [
      e.nombre,
      e.email,
      e.notaFinal !== null ? e.notaFinal.toString() : 'N/A',
      e.asistencia !== null ? e.asistencia.toString() : 'N/A',
    ]);

    console.log('Generando tabla con autoTable...');
    // Usar autoTable para crear la tabla
    autoTable(doc, {
      startY: 60,
      head: head,
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [22, 160, 133] }, // Color verde azulado
    });

    console.log('Guardando PDF...');
    // Guardar el PDF
    doc.save(`reporte_${evento.nombre.replace(/ /g, '_')}.pdf`);
    console.log('PDF guardado.');
  };

  const isFinalizado = evento?.estado === 'finalizado';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Gestión de Estudiantes</h1>
          <Tooltip content="Generar Reporte de Calificaciones">
            <Button color="gray" size="sm" onClick={handleGenerarReporte}>
              <HiPrinter className="h-5 w-5" />
            </Button>
          </Tooltip>
        </div>
        {eventoNombre && (
          <p className="text-gray-600 mt-1">Curso: <span className="font-medium">{eventoNombre}</span></p>
        )}
      </div>
      {error && <Alert color="failure" icon={HiInformationCircle} className="mb-4">{error}</Alert>}
      {isFinalizado && (
        <Alert color="info" className="mb-4">
          Este curso ha sido finalizado. La edición de notas y asistencia está desactivada.
        </Alert>
      )}
      <Table hoverable>
        <Table.Head>
          <Table.HeadCell>Estudiante</Table.HeadCell>
          <Table.HeadCell>Email</Table.HeadCell>
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
              <Table.Cell>
                <TextInput
                  type="number"
                  value={est.notaFinal ?? ''}
                  onChange={(e) => handleNotaChange(est.id, e.target.value)}
                  className="w-24"
                  disabled={isFinalizado}
                />
              </Table.Cell>
              <Table.Cell>
                <TextInput
                  type="number"
                  value={est.asistencia ?? ''}
                  onChange={(e) => handleAsistenciaChange(est.id, e.target.value)}
                  className="w-24"
                  disabled={isFinalizado}
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <div className="flex items-center mt-4 space-x-4">
        <Button color="blue" onClick={handleGuardarCambios} disabled={isFinalizado}>
          Guardar Cambios (Notas/Asistencia)
        </Button>
      </div>
    </div>
  );
};

export default GestionEstudiantes;
