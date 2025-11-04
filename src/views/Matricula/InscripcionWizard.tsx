import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Badge, Button, Card, FileInput, Progress, Spinner, Timeline, Tooltip } from 'flowbite-react';
import { supabase } from '../../utils/supabaseClient';
import { useUser } from '../../contexts/UserContext';
import { Evento } from '../../types/eventos';
import { HiCheckCircle, HiCloudUpload, HiCreditCard, HiDocumentText, HiExclamation, HiInformationCircle, HiReceiptRefund } from 'react-icons/hi';
import jsPDF from 'jspdf';

type Requisito = {
  id: number;
  evento_id: number;
  descripcion: string;
  tipo_requisito?: string;
};

type Inscripcion = {
  id: number;
  usuario_id: string;
  evento_id: number;
  estado: string; // enum en BD
  fecha_inscripcion?: string; // para recibo
};

type Pago = {
  id: number;
  inscripcion_id: number;
  comprobante_url: string | null;
  estado: string; // enum en BD
};

// Config: nombres de buckets de Storage (por defecto usamos 'eventos' que ya existe)
// Puedes definir en .env: VITE_STORAGE_BUCKET_INSCRIPCIONES y VITE_STORAGE_BUCKET_PAGOS si quieres buckets separados
const BUCKET_REQUISITOS = (import.meta.env.VITE_STORAGE_BUCKET_INSCRIPCIONES as string) || 'eventos';
const BUCKET_PAGOS = (import.meta.env.VITE_STORAGE_BUCKET_PAGOS as string) || 'eventos';

const InscripcionWizard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, loading: loadingUser } = useUser();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [requisitos, setRequisitos] = useState<Requisito[]>([]);
  const [inscripcion, setInscripcion] = useState<Inscripcion | null>(null);
  const [pago, setPago] = useState<Pago | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [uploadingReq, setUploadingReq] = useState<Record<number, boolean>>({});
  const [subidosReq, setSubidosReq] = useState<Record<number, string>>({}); // requisitoId -> url
  const [uploadingPago, setUploadingPago] = useState(false);

  const isPaid = !!evento?.es_pagado;
  const paymentApproved = isPaid && (pago?.estado === 'aprobado');

  const progressPct = useMemo(() => {
    const total = requisitos.length + (isPaid ? 1 : 0);
    if (total === 0) return 100;
    const cumplidos = Object.keys(subidosReq).length + (pago?.comprobante_url ? 1 : 0);
    return Math.min(100, Math.round((cumplidos / total) * 100));
  }, [requisitos.length, subidosReq, pago, isPaid]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        if (!id || isNaN(Number(id))) throw new Error('Evento no válido');
        if (loadingUser) return; // esperar sesión
        if (!user) {
          navigate('/auth/login');
          return;
        }

        // 1) Cargar evento
        const { data: eventoData, error: evErr } = await supabase
          .from('Eventos')
          .select('*')
          .eq('id', id)
          .single();
        if (evErr) throw evErr;
        setEvento(eventoData as Evento);

        // 2) Cargar requisitos del evento
        const { data: reqData, error: reqErr } = await supabase
          .from('requisitos')
          .select('*')
          .eq('evento_id', id);
        if (reqErr) throw reqErr;
  const reqs = (reqData || []) as Requisito[];
  setRequisitos(reqs);

        // 3) Asegurar que exista la inscripción
        const { data: inscrExist } = await supabase
          .from('inscripciones')
          .select('*')
          .eq('usuario_id', user.id)
          .eq('evento_id', id)
          .maybeSingle();

        let insc = inscrExist as Inscripcion | null;
        if (!insc) {
          const { data: inscInsert, error: inscErr } = await supabase
            .from('inscripciones')
            .insert({ usuario_id: user.id, evento_id: Number(id) })
            .select()
            .single();
          if (inscErr) throw inscErr;
          insc = inscInsert as Inscripcion;
        }
        setInscripcion(insc);

        // 4) Cargar requisitos ya presentados
        if (insc) {
          const { data: reqPres } = await supabase
            .from('inscripcion_requisitos_presentados')
            .select('requisito_id, archivo_url')
            .eq('inscripcion_id', insc.id);
          const map: Record<number, string> = {};
          (reqPres || []).forEach((r: any) => { map[r.requisito_id] = r.archivo_url; });
          setSubidosReq(map);

          // 5) Cargar pago si existe
          const { data: pagoData } = await supabase
            .from('pagos')
            .select('*')
            .eq('inscripcion_id', insc.id)
            .maybeSingle();
          const pagoRow = (pagoData as Pago) || null;
          setPago(pagoRow);

          // Actualizar estado si NO hay requisitos
          if ((reqs?.length || 0) === 0) {
            await updateInscripcionEstadoNoDocs(insc, pagoRow, eventoData as Evento);
          }
        }
      } catch (e: any) {
        setError(e.message || 'Error al iniciar inscripción');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [id, user, loadingUser, navigate]);

  const updateInscripcionEstadoNoDocs = async (
    insc: Inscripcion | null,
    p: Pago | null,
    ev: Evento | null
  ) => {
    try {
      if (!insc || !ev) return;
      if (requisitos.length > 0) return; // Solo aplica cuando no hay requisitos

      let desired: string;
      if (ev.es_pagado) {
        const hasPaidEvidence = !!(p && (p.comprobante_url || p.estado === 'aprobado'));
        desired = hasPaidEvidence ? 'pendiente_revision' : 'pendiente_pago';
      } else {
        desired = 'pendiente_revision';
      }

      if (insc.estado !== desired) {
        const { error } = await supabase
          .from('inscripciones')
          .update({ estado: desired })
          .eq('id', insc.id);
        if (!error) setInscripcion({ ...insc, estado: desired });
      }
    } catch (e) {
      // Silencioso; no bloquear flujo por estado
    }
  };

  const handleUploadRequisito = async (requisito: Requisito, file?: File | null) => {
    if (!file || !inscripcion) return;
    setUploadingReq(prev => ({ ...prev, [requisito.id]: true }));
    try {
      const ext = file.name.split('.').pop();
      const path = `${inscripcion.evento_id}/${inscripcion.usuario_id}/requisito_${requisito.id}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET_REQUISITOS)
        .upload(path, file, { upsert: true, contentType: file.type || 'application/octet-stream' });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(BUCKET_REQUISITOS).getPublicUrl(path);
      const archivo_url = pub.publicUrl;

      // Insertar o actualizar registro
      const { data: existente } = await supabase
        .from('inscripcion_requisitos_presentados')
        .select('id')
        .eq('inscripcion_id', inscripcion.id)
        .eq('requisito_id', requisito.id)
        .maybeSingle();

      if (existente?.id) {
        const { error: updErr } = await supabase
          .from('inscripcion_requisitos_presentados')
          .update({ archivo_url, estado: 'pendiente' })
          .eq('id', existente.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase
          .from('inscripcion_requisitos_presentados')
          .insert({ inscripcion_id: inscripcion.id, requisito_id: requisito.id, archivo_url, estado: 'pendiente' });
        if (insErr) throw insErr;
      }

      setSubidosReq(prev => ({ ...prev, [requisito.id]: archivo_url }));
    } catch (e: any) {
      setError(e.message || 'Error al subir requisito');
    } finally {
      setUploadingReq(prev => ({ ...prev, [requisito.id]: false }));
    }
  };

  const handleUploadComprobante = async (file?: File | null) => {
    if (!file || !inscripcion) return;
    if (paymentApproved) return; // No permitir más cargas si ya está aprobado (simulado o real)
    setUploadingPago(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${inscripcion.id}/comprobante_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET_PAGOS)
        .upload(path, file, { upsert: true, contentType: file.type || 'application/octet-stream' });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(BUCKET_PAGOS).getPublicUrl(path);
      const comprobante_url = pub.publicUrl;

      if (pago?.id) {
        const { error: updErr } = await supabase
          .from('pagos')
          .update({ comprobante_url, fecha_carga_comprobante: new Date().toISOString(), estado: 'pendiente' })
          .eq('id', pago.id);
        if (updErr) throw updErr;
        const updatedPago = { ...pago, comprobante_url, estado: 'pendiente' } as Pago;
        setPago(updatedPago);
        // Si no hay requisitos, mover estado a pendiente_revision (se pagó, en revisión)
        if (requisitos.length === 0 && evento) {
          await updateInscripcionEstadoNoDocs(inscripcion, updatedPago, evento);
        }
      } else {
        const { data: pagoIns, error: insErr } = await supabase
          .from('pagos')
          .insert({ inscripcion_id: inscripcion.id, comprobante_url, estado: 'pendiente', fecha_carga_comprobante: new Date().toISOString() })
          .select('*')
          .single();
        if (insErr) throw insErr;
        const newPago = pagoIns as Pago;
        setPago(newPago);
        if (requisitos.length === 0 && evento) {
          await updateInscripcionEstadoNoDocs(inscripcion, newPago, evento);
        }
      }
    } catch (e: any) {
      setError(e.message || 'Error al subir comprobante');
    } finally {
      setUploadingPago(false);
    }
  };

  const handleSimulatedCardPayment = async () => {
    if (!inscripcion) return;
    if (paymentApproved) return; // evitar re-pago
    try {
      // Marca el pago como aprobado (simulado)
      if (pago?.id) {
        const { error } = await supabase
          .from('pagos')
          .update({ estado: 'aprobado', fecha_revision: new Date().toISOString() })
          .eq('id', pago.id);
        if (error) throw error;
        const updatedPago = { ...pago, estado: 'aprobado' } as Pago;
        setPago(updatedPago);
        if (requisitos.length === 0 && evento) {
          await updateInscripcionEstadoNoDocs(inscripcion, updatedPago, evento);
        }
      } else {
        const { data, error } = await supabase
          .from('pagos')
          .insert({ inscripcion_id: inscripcion.id, estado: 'aprobado', fecha_revision: new Date().toISOString() })
          .select('*')
          .single();
        if (error) throw error;
        const newPago = data as Pago;
        setPago(newPago);
        if (requisitos.length === 0 && evento) {
          await updateInscripcionEstadoNoDocs(inscripcion, newPago, evento);
        }
      }
    } catch (e: any) {
      setError(e.message || 'No se pudo simular el pago');
    }
  };

  const sanitizeFileName = (s: string) => s.replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, ' ').trim().replace(/\s/g, '_');

  const loadImageAsDataUrl = async (url: string): Promise<string | null> => {
    try {
      const res = await fetch(url, { mode: 'cors' });
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const generateReceiptPdf = async () => {
    if (!evento || !inscripcion) return;

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Encabezado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Comprobante de Registro', pageWidth / 2, 20, { align: 'center' });

    // Imagen del curso si existe
    let y = 30;
    if (evento.imagen_url) {
      const dataUrl = await loadImageAsDataUrl(evento.imagen_url);
      if (dataUrl) {
        const imgWidth = 60;
        const imgHeight = 35; // aproximado
        doc.addImage(dataUrl, 'JPEG', pageWidth - imgWidth - 15, y, imgWidth, imgHeight);
      }
    }

    // Datos principales
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const lines = [
      `N° de Registro: ${inscripcion.id}`,
      `Curso/Evento: ${evento.nombre}`,
      `Fecha de inicio: ${evento.fecha_inicio_evento ? new Date(evento.fecha_inicio_evento).toLocaleString('es-EC') : 'No especificada'}`,
      `Fecha de inscripción: ${inscripcion.fecha_inscripcion ? new Date(inscripcion.fecha_inscripcion).toLocaleString('es-EC') : 'No especificada'}`,
      `Participante: ${profile ? `${profile.nombre1} ${profile.apellido1}` : (user?.email || '')}`,
      user?.email ? `Email: ${user.email}` : '',
      evento.es_pagado ? `Tipo: Pagado  |  Monto: $${evento.costo ?? 0}` : 'Tipo: Gratuito'
    ].filter(Boolean) as string[];

    y += 5;
    lines.forEach((t) => {
      doc.text(t, 15, y);
      y += 8;
    });

    // Pie
    doc.setFontSize(10);
    doc.text('Este documento es válido como comprobante de registro.', 15, 285);

    const fileName = `${inscripcion.id}_${sanitizeFileName(evento.nombre)}.pdf`;
    doc.save(fileName);
  };

  if (loading || loadingUser) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spinner size="xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert color="failure" icon={HiInformationCircle}>{error}</Alert>
      </div>
    );
  }

  if (!evento || !inscripcion) return null;

  const requisitosPendientes = requisitos.filter(r => !subidosReq[r.id]);

  return (
    <div className="container mx-auto p-4">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Inscripción a: {evento.nombre}</h1>
            <p className="text-sm text-gray-600">ID Inscripción: {inscripcion.id}</p>
          </div>
          <Badge color={isPaid ? 'warning' : 'success'}>{isPaid ? `Pago: $${evento.costo ?? 0}` : 'Gratuito'}</Badge>
        </div>

        <div className="mt-4">
          <Progress progress={progressPct} labelProgress color={progressPct === 100 ? 'green' : 'blue'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <HiDocumentText />
              <h2 className="text-lg font-semibold">Paso 1: Subir documentos</h2>
            </div>
            {requisitos.length === 0 && (
              <Alert color="info">Este evento no requiere documentos adicionales.</Alert>
            )}
            <div className="space-y-4">
              {requisitos.map((req) => (
                <div key={req.id} className="border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{req.descripcion}</p>
                    {subidosReq[req.id] ? (
                      <Badge color="success" icon={HiCheckCircle}>Subido</Badge>
                    ) : (
                      <Badge color="gray">Pendiente</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <FileInput onChange={(e) => handleUploadRequisito(req, e.target.files?.[0])} />
                    <Button
                      color="light"
                      size="sm"
                      disabled={uploadingReq[req.id]}
                      onClick={() => {
                        // Nada: se sube onChange
                      }}
                    >
                      <HiCloudUpload className="mr-1" /> {uploadingReq[req.id] ? 'Subiendo...' : 'Subir'}
                    </Button>
                    {subidosReq[req.id] && (
                      <a className="text-blue-600 underline" href={subidosReq[req.id]} target="_blank" rel="noreferrer">Ver archivo</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {requisitosPendientes.length > 0 && (
              <Alert color="warning" className="mt-3" icon={HiExclamation}>
                Faltan {requisitosPendientes.length} documento(s) por subir.
              </Alert>
            )}
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-2">
              <HiReceiptRefund />
              <h2 className="text-lg font-semibold">Paso 2: Matriculación</h2>
            </div>
            {!isPaid ? (
              <div className="space-y-3">
                <p>El curso/evento es gratuito. Verifica tus datos antes de confirmar tu registro.</p>
                <div className="text-sm text-gray-700 border rounded p-3">
                  <p><span className="font-medium">Participante:</span> {profile ? `${profile.nombre1} ${profile.apellido1}` : user?.email}</p>
                  <p><span className="font-medium">Evento:</span> {evento.nombre}</p>
                </div>
                <Tooltip content="Descarga tu comprobante en PDF" placement="top">
                  <Button color="success" onClick={generateReceiptPdf}>
                    Generar comprobante de registro
                  </Button>
                </Tooltip>
                <Alert color="info">Tu inscripción queda registrada. La confirmación puede estar sujeta a revisión.</Alert>
              </div>
            ) : (
              <div className="space-y-4">
                <p>Este evento requiere pago. Sube tu comprobante o usa el simulador de pago.</p>
                  <div className="flex items-center gap-3">
                    <FileInput onChange={(e) => handleUploadComprobante(e.target.files?.[0])} disabled={paymentApproved} />
                    <Button color="light" size="sm" onClick={() => { /* subida onChange */ }} disabled={uploadingPago || paymentApproved}>
                      <HiCloudUpload className="mr-1" /> {uploadingPago ? 'Subiendo...' : 'Subir comprobante'}
                    </Button>
                  </div>
                  {pago?.comprobante_url && (
                    <Alert color="success">Comprobante cargado. Estado de pago: <b className="capitalize">{pago.estado}</b> — <a className="underline" href={pago.comprobante_url || ''} target="_blank" rel="noreferrer">Ver archivo</a></Alert>
                  )}
                  <div className="flex items-center gap-2">
                    <Button color="purple" onClick={handleSimulatedCardPayment} disabled={paymentApproved}>
                      <HiCreditCard className="mr-1" /> {paymentApproved ? 'Pago aprobado' : 'Pagar con tarjeta (simulado)'}
                    </Button>
                    <small className="text-gray-500">{paymentApproved ? 'El pago está aprobado; no es posible volver a pagar.' : 'Opcional para pruebas — marca el pago como aprobado'}</small>
                  </div>
                <div>
                  <Button color="success" onClick={generateReceiptPdf}>
                    Generar comprobante de registro
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="mt-6">
          <Timeline>
            <Timeline.Item>
              <Timeline.Point icon={HiDocumentText} />
              <Timeline.Content>
                <Timeline.Time>Paso 1</Timeline.Time>
                <Timeline.Title>Sube tus documentos</Timeline.Title>
                <Timeline.Body>Requisitos obligatorios si el evento los define. Estado actual: {Object.keys(subidosReq).length}/{requisitos.length} subidos.</Timeline.Body>
              </Timeline.Content>
            </Timeline.Item>
            <Timeline.Item>
              <Timeline.Point icon={HiReceiptRefund} />
              <Timeline.Content>
                <Timeline.Time>Paso 2</Timeline.Time>
                <Timeline.Title>{isPaid ? 'Pago y comprobante' : 'Confirmación de registro'}</Timeline.Title>
                <Timeline.Body>
                  {isPaid ? 'Sube un comprobante o usa el simulador para completar el proceso.' : 'Genera y guarda tu comprobante de registro.'}
                </Timeline.Body>
              </Timeline.Content>
            </Timeline.Item>
          </Timeline>
        </div>

        <div className="mt-6 flex justify-between">
          <Button color="gray" onClick={() => navigate(-1)}>Volver</Button>
          <Button color="success" onClick={() => navigate(`/evento/${evento.id}`)}>Ir al detalle</Button>
        </div>
      </Card>
    </div>
  );
};

export default InscripcionWizard;
