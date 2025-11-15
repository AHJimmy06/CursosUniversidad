import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Spinner, Table, Tooltip } from 'flowbite-react';
import { HiCheck, HiDownload, HiInformationCircle, HiX } from 'react-icons/hi';
import { useUser } from 'src/contexts/UserContext';
import { supabase } from 'src/utils/supabaseClient';
import { Evento } from 'src/types/eventos';
import { useParams } from 'react-router-dom';
import RejectionModal from './RejectionModal'; // Importar el nuevo modal

const BUCKET_PAGOS = (import.meta.env.VITE_STORAGE_BUCKET_PAGOS as string) || 'comprobantes-pago';

// Tipos locales
interface InscripcionRow {
  id: number;
  usuario_id: string;
  evento_id: number;
  estado: string;
  fecha_inscripcion?: string;
}

interface PerfilLite {
  id: string;
  nombre1: string;
  apellido1: string;
  email: string;
  cedula?: string;
  telefono?: string;
}

interface PagoLite {
  id: number;
  inscripcion_id: number;
  comprobante_url: string | null;
  estado: 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado';
}

const ValidacionMatriculas: React.FC = () => {
  const { user, loading: loadingUser } = useUser();
  const { cursoId } = useParams<{ cursoId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inscripciones, setInscripciones] = useState<InscripcionRow[]>([]);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [perfiles, setPerfiles] = useState<Record<string, PerfilLite>>({});
  const [pagos, setPagos] = useState<Record<number, PagoLite>>({});
  const [processing, setProcessing] = useState<Record<number, boolean>>({});

  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionTarget, setRejectionTarget] = useState<InscripcionRow | null>(null);

  const canLoad = useMemo(() => !!user && !loadingUser && !!cursoId, [user, loadingUser, cursoId]);

  const fetchData = async () => {
    if (!canLoad) return;
    setLoading(true);
    setError(null);
    try {
      const { data: ev, error: e2 } = await supabase.from('Eventos').select('*').eq('id', cursoId).single();
      if (e2) throw e2;
      if (ev.responsable_id !== user!.id) throw new Error('No tienes permisos para validar matrículas en este evento.');
      setEvento(ev as Evento);

      const { data: insc, error: e1 } = await supabase.from('inscripciones').select('id, usuario_id, evento_id, estado, fecha_inscripcion').eq('evento_id', cursoId).eq('estado', 'pendiente_pago');
      if (e1) throw e1;
      const inscRows = (insc || []) as InscripcionRow[];
      setInscripciones(inscRows);

      if (inscRows.length === 0) {
        setPerfiles({});
        setPagos({});
        return;
      }

      const perfilIds = Array.from(new Set(inscRows.map((i) => i.usuario_id)));
      const { data: perf, error: e3 } = await supabase.from('perfiles').select('id, nombre1, apellido1, email, cedula, telefono').in('id', perfilIds);
      if (e3) throw e3;
      setPerfiles(Object.fromEntries((perf || []).map((p: any) => [p.id, p as PerfilLite])));

      const inscIds = inscRows.map((i) => i.id);
      const { data: pagosRows, error: e4 } = await supabase.from('pagos').select('id, inscripcion_id, comprobante_url, estado').in('inscripcion_id', inscIds);
      if (e4) throw e4;
      setPagos(Object.fromEntries((pagosRows || []).map((p: any) => [p.inscripcion_id, p as PagoLite])));

    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la lista de validaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [canLoad, user, cursoId]);

  const resolveFileUrl = async (bucket: string, path?: string | null) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 5);
    if (!error && data?.signedUrl) return data.signedUrl;
    const pub = supabase.storage.from(bucket).getPublicUrl(path);
    return pub?.data?.publicUrl || null;
  };

  import { useModal } from 'src/contexts/ModalContext';

// ... (dentro del componente ValidacionMatriculas)
  const { showModal } = useModal();

  const openComprobante = async (inscripcion_id: number) => {
    const pago = pagos[inscripcion_id];
    const url = await resolveFileUrl(BUCKET_PAGOS, pago?.comprobante_url || null);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      showModal({
        title: 'Error',
        body: 'No se encontró un comprobante para esta inscripción.',
        showCancel: false,
        confirmText: 'Cerrar',
      });
    }
  };

  const handleOpenRejectionModal = (row: InscripcionRow) => {
    setRejectionTarget(row);
    setShowRejectionModal(true);
  };

  const aprobar = async (row: InscripcionRow) => {
    setProcessing((p) => ({ ...p, [row.id]: true }));
    setError(null);
    try {
      const { error } = await supabase.rpc('approve_payment', {
        p_inscripcion_id: row.id,
        p_revisor_id: user!.id,
      });
      if (error) throw error;
      setInscripciones((list) => list.filter((i) => i.id !== row.id));
    } catch (e: any) {
      setError(e.message || 'No se pudo aprobar la inscripción');
    } finally {
      setProcessing((p) => ({ ...p, [row.id]: false }));
    }
  };

  const rechazar = async (reason: string) => {
    if (!rejectionTarget) return;
    setProcessing((p) => ({ ...p, [rejectionTarget.id]: true }));
    setError(null);
    try {
      const { error } = await supabase.rpc('reject_payment', {
        p_inscripcion_id: rejectionTarget.id,
        p_revisor_id: user!.id,
        p_motivo_rechazo: reason,
      });
      if (error) throw error;
      setShowRejectionModal(false);
      setInscripciones((list) => list.filter((i) => i.id !== rejectionTarget.id));
    } catch (e: any) {
      setError(e.message || 'No se pudo rechazar la inscripción');
    } finally {
      setProcessing((p) => ({ ...p, [rejectionTarget.id]: false }));
      setRejectionTarget(null);
    }
  };

  if (loading || loadingUser) {
    return <div className="flex justify-center items-center h-[60vh]"><Spinner size="xl" /></div>;
  }

  return (
    <>
      <div className="container mx-auto p-4">
        <Card>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Validación de Pagos para {evento?.nombre}</h1>
            <Badge color="warning">Pendientes de Pago</Badge>
          </div>
          {error && <Alert color="failure" className="mt-3" icon={HiInformationCircle}>{error}</Alert>}
          <div className="overflow-x-auto mt-4">
            <Table hoverable>
              <Table.Head>
                <Table.HeadCell>ID</Table.HeadCell>
                <Table.HeadCell>Estudiante</Table.HeadCell>
                <Table.HeadCell>Email</Table.HeadCell>
                <Table.HeadCell>Cédula</Table.HeadCell>
                <Table.HeadCell>Teléfono</Table.HeadCell>
                <Table.HeadCell>Comprobante</Table.HeadCell>
                <Table.HeadCell>Acciones</Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {inscripciones.map((row) => {
                  const pf = perfiles[row.usuario_id];
                  const pg = pagos[row.id];
                  return (
                    <Table.Row key={row.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                      <Table.Cell className="font-medium">{row.id}</Table.Cell>
                      <Table.Cell>{pf ? `${pf.nombre1} ${pf.apellido1}` : row.usuario_id}</Table.Cell>
                      <Table.Cell>{pf?.email || '-'}</Table.Cell>
                      <Table.Cell>{pf?.cedula || '-'}</Table.Cell>
                      <Table.Cell>{pf?.telefono || '-'}</Table.Cell>
                      <Table.Cell>
                        {pg?.comprobante_url ? (
                          <Tooltip content="Ver comprobante de pago">
                            <Button size="xs" color="blue" onClick={() => openComprobante(row.id)}><HiDownload /></Button>
                          </Tooltip>
                        ) : <span className="text-gray-400">Sin comprobante</span>}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex gap-2">
                          <Tooltip content="Aprobar Pago">
                            <Button size="xs" color="success" onClick={() => aprobar(row)} isProcessing={!!processing[row.id]}><HiCheck /></Button>
                          </Tooltip>
                          <Tooltip content="Rechazar Pago">
                            <Button size="xs" color="failure" onClick={() => handleOpenRejectionModal(row)} isProcessing={!!processing[row.id]}><HiX /></Button>
                          </Tooltip>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
            {inscripciones.length === 0 && <div className="text-center text-gray-500 py-8">No hay pagos pendientes de validación para este evento.</div>}
          </div>
        </Card>
      </div>
      <RejectionModal 
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        onSubmit={rechazar}
        isProcessing={!!rejectionTarget && !!processing[rejectionTarget.id]}
      />
    </>
  );
};

export default ValidacionMatriculas;