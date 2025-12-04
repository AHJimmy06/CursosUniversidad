import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Spinner, Table, Tooltip, Modal } from 'flowbite-react';
import { HiCheck, HiDownload, HiInformationCircle, HiX, HiPrinter } from 'react-icons/hi';
import { useUser } from 'src/contexts/UserContext';
import { supabase } from 'src/utils/supabaseClient';
import { Evento, Inscripcion, PerfilSimple } from 'src/types/eventos';
import { useParams } from 'react-router-dom';
import RejectionModal from './RejectionModal';

interface PagoLite {
  id: number;
  inscripcion_id: number;
  comprobante_url: string | null;
  estado: 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado';
}

interface InscripcionConDetalles extends Inscripcion {
  perfiles: PerfilSimple;
  pagos: PagoLite[];
}

const ValidacionMatriculas: React.FC = () => {
  const { user, loading: loadingUser } = useUser();
  const { cursoId } = useParams<{ cursoId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inscripciones, setInscripciones] = useState<InscripcionConDetalles[]>([]);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [processing, setProcessing] = useState<Record<number, boolean>>({});

  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionTarget, setRejectionTarget] = useState<InscripcionConDetalles | null>(null);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedInscripcion, setSelectedInscripcion] = useState<InscripcionConDetalles | null>(null);
  const [isFsImgOpen, setIsFsImgOpen] = useState(false);
  const [fsImgUrl, setFsImgUrl] = useState<string | null>(null);

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

      const { data: insc, error: e1 } = await supabase.from('inscripciones').select('*, perfiles(*)').eq('evento_id', cursoId).eq('estado', 'pendiente_revision');
      if (e1) throw e1;
      
      const inscripcionesData = (insc || []) as (Inscripcion & { perfiles: PerfilSimple })[];

      if (inscripcionesData.length === 0) {
        setInscripciones([]);
        setLoading(false);
        return;
      }

      const inscIds = inscripcionesData.map((i) => i.id);
      const { data: pagosRows, error: e4 } = await supabase.from('pagos').select('*').in('inscripcion_id', inscIds);
      if (e4) throw e4;
      
      const pagosMap = new Map<number, PagoLite[]>();
      (pagosRows || []).forEach((p: any) => {
          if (!pagosMap.has(p.inscripcion_id)) {
              pagosMap.set(p.inscripcion_id, []);
          }
          pagosMap.get(p.inscripcion_id)!.push(p as PagoLite);
      });

      const fullInscripciones = inscripcionesData.map(i => ({
          ...i,
          pagos: pagosMap.get(i.id) || []
      }));

      setInscripciones(fullInscripciones);

    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la lista de validaciones');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, [canLoad, user, cursoId]);

  const openReviewModal = (inscripcion: InscripcionConDetalles) => {
    setSelectedInscripcion(inscripcion);
    setIsReviewModalOpen(true);
  };
  
  const handleOpenFsImg = (url: string) => {
    setFsImgUrl(url);
    setIsFsImgOpen(true);
  };

  const handleCloseFsImg = () => {
    setIsFsImgOpen(false);
    setFsImgUrl(null);
  };

  const handleOpenRejectionModal = (row: InscripcionConDetalles) => {
    setRejectionTarget(row);
    setShowRejectionModal(true);
    setIsReviewModalOpen(false); 
  };

  const aprobar = async (row: InscripcionConDetalles) => {
    setProcessing((p) => ({ ...p, [row.id]: true }));
    setError(null);
    try {
      const { error } = await supabase.rpc('approve_payment', { p_inscripcion_id: row.id, p_revisor_id: user!.id });
      if (error) throw error;
      setIsReviewModalOpen(false);
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
      const { error } = await supabase.rpc('reject_payment', { p_inscripcion_id: rejectionTarget.id, p_revisor_id: user!.id, p_motivo_rechazo: reason });
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

  const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif)$/i.test(url);

  if (loading || loadingUser) {
    return <div className="flex justify-center items-center h-[60vh]"><Spinner size="xl" /></div>;
  }

  return (
    <>
      <div className="container mx-auto p-4">
        <Card>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Validación de Pagos para {evento?.nombre}</h1>
            <Badge color="warning">Pendientes de Revisión</Badge>
          </div>
          {error && <Alert color="failure" className="mt-3" icon={HiInformationCircle}>{error}</Alert>}
          <div className="overflow-x-auto mt-4">
            <Table hoverable>
              <Table.Head>
                <Table.HeadCell>ID</Table.HeadCell>
                <Table.HeadCell>Estudiante</Table.HeadCell>
                <Table.HeadCell>Email</Table.HeadCell>
                <Table.HeadCell>Validar Pago</Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {inscripciones.map((row) => (
                  <Table.Row key={row.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Table.Cell className="font-medium">{row.id}</Table.Cell>
                    <Table.Cell>{row.perfiles ? `${row.perfiles.nombre1} ${row.perfiles.apellido1}` : row.usuario_id}</Table.Cell>
                    <Table.Cell>{row.perfiles?.email || '-'}</Table.Cell>
                    <Table.Cell>
                      {row.pagos?.[0]?.comprobante_url ? (
                        <Button size="xs" color="blue" onClick={() => openReviewModal(row)}>
                            <HiCheck className="mr-2"/> Revisar y Aprobar
                        </Button>
                      ) : <span className="text-gray-400">Sin comprobante</span>}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
            {inscripciones.length === 0 && <div className="text-center text-gray-500 py-8">No hay pagos pendientes de validación para este evento.</div>}
          </div>
        </Card>
      </div>

      {selectedInscripcion && (
        <Modal show={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} size="4xl">
          <Modal.Header>Revisar Comprobante de Pago</Modal.Header>
          <Modal.Body>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="w-full h-96 border rounded-lg overflow-hidden">
                {isImageUrl(selectedInscripcion.pagos[0].comprobante_url!) ? (
                  <img src={selectedInscripcion.pagos[0].comprobante_url!} alt="Comprobante" className="w-full h-full object-contain cursor-pointer" onClick={() => handleOpenFsImg(selectedInscripcion.pagos[0].comprobante_url!)} />
                ) : (
                  <iframe src={selectedInscripcion.pagos[0].comprobante_url!} className="w-full h-full" title="Comprobante"></iframe>
                )}
              </div>
              <div className="flex flex-col justify-center gap-4">
                 <Button color="success" onClick={() => aprobar(selectedInscripcion)} isProcessing={!!processing[selectedInscripcion.id]}>
                    <HiCheck className="mr-2 h-5 w-5" />
                    Aprobar Pago
                  </Button>
                  <Button color="failure" onClick={() => handleOpenRejectionModal(selectedInscripcion)} isProcessing={!!processing[selectedInscripcion.id]}>
                    <HiX className="mr-2 h-5 w-5" />
                    Rechazar Pago
                  </Button>
              </div>
            </div>
          </Modal.Body>
        </Modal>
      )}

      {isFsImgOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black bg-opacity-75" onClick={handleCloseFsImg}>
          <img src={fsImgUrl!} alt="Fullscreen" className="max-h-full max-w-full" />
        </div>
      )}

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