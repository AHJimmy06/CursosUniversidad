import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Spinner, Table, Tooltip } from 'flowbite-react';
import { HiCheck, HiDownload, HiInformationCircle, HiX } from 'react-icons/hi';
import { useUser } from '../../contexts/UserContext';
import { supabase } from '../../utils/supabaseClient';
import { Evento } from '../../types/eventos';

// Estados válidos
const INS_CONFIRMADA = 'confirmada';
const INS_PEND_PAGO = 'pendiente_pago';
const INS_RECHAZADA = 'rechazada';

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
  comprobante_url: string | null; // path o url legado
  estado: 'pendiente' | 'aprobado' | 'rechazado';
}

const ValidacionMatriculas: React.FC = () => {
  const { user, loading: loadingUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inscripciones, setInscripciones] = useState<InscripcionRow[]>([]);
  const [eventos, setEventos] = useState<Record<number, Evento>>({});
  const [perfiles, setPerfiles] = useState<Record<string, PerfilLite>>({});
  const [pagos, setPagos] = useState<Record<number, PagoLite>>({});
  const [processing, setProcessing] = useState<Record<number, boolean>>({});

  const canLoad = useMemo(() => !!user && !loadingUser, [user, loadingUser]);

  useEffect(() => {
    const fetchData = async () => {
      if (!canLoad) return;
      setLoading(true);
      setError(null);
      try {
        // Traer inscripciones en pendiente_revision en eventos donde el user es responsable o docente
        const { data: insc, error: e1 } = await supabase
          .from('inscripciones')
          .select('id, usuario_id, evento_id, estado, fecha_inscripcion')
          .eq('estado', 'pendiente_revision');
        if (e1) throw e1;
        const inscRows = (insc || []) as InscripcionRow[];

        // Filtrar por eventos donde el usuario es responsable o docente (seguridad por app; RLS debe reforzarlo)
        const eventoIds = Array.from(new Set(inscRows.map((i) => i.evento_id)));
        if (eventoIds.length === 0) {
          setInscripciones([]);
          setEventos({});
          setPerfiles({});
          setPagos({});
          return;
        }
        const { data: evs, error: e2 } = await supabase
          .from('Eventos')
          .select('*')
          .in('id', eventoIds);
        if (e2) throw e2;
        const relevant = (evs || []).filter((ev: any) => ev.responsable_id === user!.id || ev.docente_id === user!.id) as Evento[];
        const relevantIds = new Set(relevant.map((e) => e.id));
        const filteredInsc = inscRows.filter((i) => relevantIds.has(i.evento_id));

        // Perfiles de estudiantes
        const perfilIds = Array.from(new Set(filteredInsc.map((i) => i.usuario_id)));
        const { data: perf, error: e3 } = await supabase
          .from('perfiles')
          .select('id, nombre1, apellido1, email, cedula, telefono')
          .in('id', perfilIds);
        if (e3) throw e3;

        // Pagos de esas inscripciones
        const inscIds = filteredInsc.map((i) => i.id);
        const { data: pagosRows, error: e4 } = await supabase
          .from('pagos')
          .select('id, inscripcion_id, comprobante_url, estado')
          .in('inscripcion_id', inscIds);
        if (e4) throw e4;

        setInscripciones(filteredInsc);
        setEventos(Object.fromEntries(relevant.map((e) => [e.id, e])));
        setPerfiles(Object.fromEntries((perf || []).map((p: any) => [p.id, p as PerfilLite])));
        setPagos(Object.fromEntries((pagosRows || []).map((p: any) => [p.inscripcion_id, p as PagoLite])));
      } catch (err: any) {
        setError(err.message || 'No se pudo cargar la lista de validaciones');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [canLoad, user]);

  const resolveFileUrl = async (bucket: string, path?: string | null) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path; // legado público
    // Firmar en bucket configurado o legacy
    const candidates = [bucket, 'eventos'];
    for (const b of candidates) {
      const { data, error } = await supabase.storage.from(b).createSignedUrl(path, 60 * 5);
      if (!error && data?.signedUrl) return data.signedUrl;
    }
    // Último recurso (si el bucket es público)
    for (const b of candidates) {
      const pub = supabase.storage.from(b).getPublicUrl(path);
      if (pub?.data?.publicUrl) return pub.data.publicUrl;
    }
    return null;
  };

  const openComprobante = async (inscripcion_id: number) => {
    const pago = pagos[inscripcion_id];
    const url = await resolveFileUrl(BUCKET_PAGOS, pago?.comprobante_url || null);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else alert('No se encontró un comprobante para esta inscripción.');
  };

  const aprobar = async (row: InscripcionRow) => {
    setProcessing((p) => ({ ...p, [row.id]: true }));
    setError(null);
    try {
      // Si hay pago, marcar como aprobado con metadatos
      const pago = pagos[row.id];
      if (pago?.id) {
        const { error: ep } = await supabase
          .from('pagos')
          .update({ estado: 'aprobado', fecha_revision: new Date().toISOString() })
          .eq('id', pago.id);
        if (ep) throw ep;
      }
      // Confirmar inscripción
      const { error: ei } = await supabase
        .from('inscripciones')
        .update({ estado: INS_CONFIRMADA })
        .eq('id', row.id);
      if (ei) throw ei;
      // Refrescar UI
      setInscripciones((list) => list.filter((i) => i.id !== row.id));
    } catch (e: any) {
      setError(e.message || 'No se pudo aprobar la inscripción');
    } finally {
      setProcessing((p) => ({ ...p, [row.id]: false }));
    }
  };

  const rechazar = async (row: InscripcionRow) => {
    setProcessing((p) => ({ ...p, [row.id]: true }));
    setError(null);
    try {
      // Si hay pago, marcar como rechazado
      const pago = pagos[row.id];
      if (pago?.id) {
        const { error: ep } = await supabase
          .from('pagos')
          .update({ estado: 'rechazado', fecha_revision: new Date().toISOString() })
          .eq('id', pago.id);
        if (ep) throw ep;
      }
      // Si el evento es pagado -> pendiente_pago (reintento). Si es gratuito -> rechazada
      const ev = eventos[row.evento_id];
      const nextState = ev?.es_pagado ? INS_PEND_PAGO : INS_RECHAZADA;
      const { error: ei } = await supabase
        .from('inscripciones')
        .update({ estado: nextState })
        .eq('id', row.id);
      if (ei) throw ei;
      // Refrescar UI
      setInscripciones((list) => list.filter((i) => i.id !== row.id));
    } catch (e: any) {
      setError(e.message || 'No se pudo rechazar la inscripción');
    } finally {
      setProcessing((p) => ({ ...p, [row.id]: false }));
    }
  };

  if (loading || loadingUser) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Validación de Matrículas</h1>
          <Badge color="info">Pendientes de revisión</Badge>
        </div>
        {error && (
          <Alert color="failure" className="mt-3" icon={HiInformationCircle}>
            {error}
          </Alert>
        )}
        <div className="overflow-x-auto mt-4">
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>ID</Table.HeadCell>
              <Table.HeadCell>Estudiante</Table.HeadCell>
              <Table.HeadCell>Email</Table.HeadCell>
              <Table.HeadCell>Cédula</Table.HeadCell>
              <Table.HeadCell>Teléfono</Table.HeadCell>
              <Table.HeadCell>Evento</Table.HeadCell>
              <Table.HeadCell>Comprobante</Table.HeadCell>
              <Table.HeadCell>Acciones</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {inscripciones.map((row) => {
                const ev = eventos[row.evento_id];
                const pf = perfiles[row.usuario_id];
                const pg = pagos[row.id];
                return (
                  <Table.Row key={row.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Table.Cell className="font-medium">{row.id}</Table.Cell>
                    <Table.Cell>{pf ? `${pf.nombre1} ${pf.apellido1}` : row.usuario_id}</Table.Cell>
                    <Table.Cell>{pf?.email || '-'}</Table.Cell>
                    <Table.Cell>{pf?.cedula || '-'}</Table.Cell>
                    <Table.Cell>{pf?.telefono || '-'}</Table.Cell>
                    <Table.Cell>{ev?.nombre || row.evento_id}</Table.Cell>
                    <Table.Cell>
                      {ev?.es_pagado ? (
                        pg?.comprobante_url ? (
                          <Tooltip content="Ver comprobante">
                            <Button size="xs" color="blue" onClick={() => openComprobante(row.id)}>
                              <HiDownload />
                            </Button>
                          </Tooltip>
                        ) : (
                          <span className="text-gray-400">Sin comprobante</span>
                        )
                      ) : (
                        <span className="text-gray-500">No aplica</span>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex gap-2">
                        <Tooltip content="Aprobar">
                          <Button size="xs" color="success" onClick={() => aprobar(row)} isProcessing={!!processing[row.id]}>
                            <HiCheck />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Rechazar (volver a pendiente de pago)">
                          <Button size="xs" color="failure" onClick={() => rechazar(row)} isProcessing={!!processing[row.id]}>
                            <HiX />
                          </Button>
                        </Tooltip>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
          {inscripciones.length === 0 && (
            <div className="text-center text-gray-500 py-8">No hay inscripciones pendientes de revisión.</div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ValidacionMatriculas;
