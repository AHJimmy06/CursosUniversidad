import React, { useState, useEffect } from 'react';
import { Button, Table, Spinner, Badge, Alert, Tooltip, TextInput } from 'flowbite-react';
import { supabase } from '../../utils/supabaseClient';
import { useParams } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { HiCheck, HiXCircle, HiDownload, HiInformationCircle } from 'react-icons/hi';

type PagoEstado = 'pendiente' | 'aprobado' | 'rechazado';

type Pago = {
  id: number;
  inscripcion_id: number;
  comprobante_url: string | null; // almacenamos PATH en Storage, no URL pública
  estado: PagoEstado;
  revisor_id?: string | null;
  fecha_revision?: string | null;
};

type EstudianteGestion = {
  id: number; // id de inscripcion
  nombre: string;
  email: string;
  curso: string;
  notaFinal: number | null;
  asistencia: number | null;
  pago_id?: number;
  pago_estado?: PagoEstado | null;
  comprobante_path?: string | null;
};

const BUCKET_PAGOS = (import.meta.env.VITE_STORAGE_BUCKET_PAGOS as string) || 'comprobantes-pago';
// Ajusta estos nombres a tu enum estado_inscripcion en BD
const INSCRIPCION_STATE_PENDIENTE_PAGO = 'pendiente_pago';
const INSCRIPCION_STATE_CONFIRMADA = 'confirmada';

const GestionEstudiantes: React.FC = () => {
  const [estudiantes, setEstudiantes] = useState<EstudianteGestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingPayment, setUpdatingPayment] = useState<Record<number, boolean>>({});
  const [eventoNombre, setEventoNombre] = useState<string>('');
  const { cursoId } = useParams<{ cursoId: string }>();
  const { user } = useUser();

  useEffect(() => {
    const fetchEstudiantes = async () => {
      if (!cursoId) return;

      setLoading(true);
      setError(null);
      try {
        // Traer nombre del evento/curso para mostrarlo en la cabecera y filas
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
        const inscripcionIds = (inscripciones || []).map((i: any) => i.id);

        const { data: perfiles, error: errorPerfiles } = await supabase
          .from('perfiles')
          .select('id, nombre1, apellido1, email')
          .in('id', estudianteIds);

        if (errorPerfiles) throw errorPerfiles;

        const { data: pagos, error: errorPagos } = await supabase
          .from('pagos')
          .select('*')
          .in('inscripcion_id', inscripcionIds);

        if (errorPagos) throw errorPagos;

        const estudiantesData: EstudianteGestion[] = (inscripciones || []).map((inscripcion: any) => {
          const perfil = (perfiles || []).find((p: any) => p.id === inscripcion.usuario_id);
          const pago = (pagos || []).find((p: any) => p.inscripcion_id === inscripcion.id) as Pago | undefined;
          return {
            id: inscripcion.id,
            nombre: `${perfil?.nombre1 ?? ''} ${perfil?.apellido1 ?? ''}`.trim(),
            email: perfil?.email ?? '',
            curso: nombreCurso,
            notaFinal: inscripcion.nota_final,
            asistencia: inscripcion.asistencia,
            pago_id: pago?.id,
            pago_estado: pago?.estado ?? null,
            comprobante_path: pago?.comprobante_url ?? null, // aquí guardamos path
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
      alert('Cambios guardados con éxito');
    } catch (error) {
      console.error('Error al guardar los cambios:', error);
      alert('Error al guardar los cambios');
    }
  };

  const handleUpdatePago = async (pago_id: number | undefined, newState: PagoEstado) => {
    if (!user || !pago_id) return;
    setUpdatingPayment(prev => ({ ...prev, [pago_id]: true }));
    setError(null);

    const { data, error: updateError } = await supabase
      .from('pagos')
      .update({
        estado: newState,
        revisor_id: user.id,
        fecha_revision: new Date().toISOString()
      })
      .eq('id', pago_id)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      alert('Error al actualizar el pago');
    } else if (data) {
      setEstudiantes(prevEstudiantes =>
        prevEstudiantes.map(est =>
          est.pago_id === pago_id
            ? { ...est, pago_estado: data.estado }
            : est
        )
      );
      // Actualizar estado de la inscripcion si procede
      try {
        const est = estudiantes.find(e => e.pago_id === pago_id);
        if (est) {
          if (newState === 'aprobado') {
            await supabase.from('inscripciones').update({ estado: INSCRIPCION_STATE_CONFIRMADA }).eq('id', est.id);
          } else if (newState === 'rechazado') {
            await supabase.from('inscripciones').update({ estado: INSCRIPCION_STATE_PENDIENTE_PAGO }).eq('id', est.id);
          }
        }
      } catch (e) {
        console.warn('No se pudo actualizar el estado de la inscripción. Verifica los valores del enum.', e);
      }
    }
    setUpdatingPayment(prev => ({ ...prev, [pago_id]: false }));
  };

  const getPagoBadge = (estado: PagoEstado | null | undefined) => {
    switch (estado) {
      case 'aprobado':
        return <Badge color="success">Aprobado</Badge>;
      case 'pendiente':
        return <Badge color="warning">Pendiente</Badge>;
      case 'rechazado':
        return <Badge color="failure">Rechazado</Badge>;
      default:
        return <Badge color="gray">N/A</Badge>;
    }
  };

  const openSignedComprobante = async (raw?: string | null) => {
    if (!raw) return;
    try {
      // Caso 1: URL público legado -> abrir directo
      if (/^https?:\/\//i.test(raw)) {
        window.open(raw, '_blank', 'noopener,noreferrer');
        return;
      }

      // Caso 2: intentar firmar con buckets conocidos (migración)
      const candidateBuckets = [BUCKET_PAGOS, 'eventos'];
      for (const bucket of candidateBuckets) {
        const { data, error } = await supabase.storage.from(bucket).createSignedUrl(raw, 60 * 5);
        if (!error && data?.signedUrl) {
          window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
          return;
        }
        if (error) {
          console.warn('createSignedUrl error', { bucket, path: raw, error });
        }
      }

      // Caso 3: el archivo puede existir pero con otro nombre (por ejemplo, se regeneró)
      // Intentar listar el directorio y tomar el último comprobante_*.pdf
      const dir = raw.split('/')[0];
      if (dir) {
        for (const bucket of candidateBuckets) {
          const list = await supabase.storage.from(bucket).list(dir, { limit: 50, sortBy: { column: 'name', order: 'desc' as const } });
          if (!list.error) {
            const items = (list.data || []).filter((f) => f.name?.toLowerCase().startsWith('comprobante_'));
            if (items.length > 0) {
              const key = `${dir}/${items[0].name}`;
              const signed = await supabase.storage.from(bucket).createSignedUrl(key, 60 * 5);
              if (!signed.error && signed.data?.signedUrl) {
                window.open(signed.data.signedUrl, '_blank', 'noopener,noreferrer');
                return;
              }
            }
          }
        }
      }
      // Caso 4: como último recurso, intentar abrir como URL pública (si el bucket es público)
      for (const bucket of candidateBuckets) {
        const pub = supabase.storage.from(bucket).getPublicUrl(raw);
        if (pub?.data?.publicUrl) {
          // No podemos saber si será accesible hasta abrirlo, pero es un último intento
          window.open(pub.data.publicUrl, '_blank', 'noopener,noreferrer');
          return;
        }
      }
      alert('No se pudo localizar ni firmar el comprobante. Verifica el bucket, la ruta o los permisos.');
    } catch (e) {
      console.error('openSignedComprobante exception', e);
      alert('No se pudo generar el enlace del comprobante.');
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
          <Table.HeadCell>Estado Pago</Table.HeadCell>
          <Table.HeadCell>Acciones de Pago</Table.HeadCell>
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
              <Table.Cell>
                {getPagoBadge(est.pago_estado)}
              </Table.Cell>
              <Table.Cell>
                {!est.pago_id || !est.comprobante_path ? (
                  <span className="text-gray-400">N/A</span>
                ) : est.pago_estado === 'pendiente' ? (
                  <div className="flex gap-2">
                    <Tooltip content="Descargar Comprobante">
                      <Button size="xs" color="blue" onClick={() => openSignedComprobante(est.comprobante_path)}>
                        <HiDownload />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Aprobar Pago">
                      <Button size="xs" color="success" onClick={() => handleUpdatePago(est.pago_id!, 'aprobado')} isProcessing={!!updatingPayment[est.pago_id!] }>
                        <HiCheck />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Rechazar Pago">
                      <Button size="xs" color="failure" onClick={() => handleUpdatePago(est.pago_id!, 'rechazado')} isProcessing={!!updatingPayment[est.pago_id!] }>
                        <HiXCircle />
                      </Button>
                    </Tooltip>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <span className="text-gray-500 capitalize">{est.pago_estado}</span>
                    <Tooltip content="Ver Comprobante">
                      <Button size="xs" color="blue" onClick={() => openSignedComprobante(est.comprobante_path)}>
                        <HiDownload />
                      </Button>
                    </Tooltip>
                  </div>
                )}
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