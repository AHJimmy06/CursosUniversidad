import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, FileInput, Label, Spinner } from 'flowbite-react';
import { supabase } from 'src/utils/supabaseClient';
import { useUser } from 'src/contexts/UserContext';
import { Evento, Inscripcion } from 'src/types/eventos';
import { HiCheckCircle, HiReceiptRefund, HiInformationCircle, HiDocumentText, HiOutlineDocumentDownload, HiOutlineExclamationCircle } from 'react-icons/hi';

const BUCKET_PAGOS = (import.meta.env.VITE_STORAGE_BUCKET_PAGOS as string) || 'comprobantes-pago';

const InscripcionWizard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: loadingUser } = useUser();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [currentInscription, setCurrentInscription] = useState<Inscripcion | null>(null);
  const [step, setStep] = useState<'loading' | 'documents' | 'payment' | 'final' | 'review_pending' | 'success' | 'error'>('loading');
  
  const [tituloTercerNivelFile, setTituloTercerNivelFile] = useState<File | null>(null);
  const [cartaMotivacionFile, setCartaMotivacionFile] = useState<File | null>(null);
  const [certificacionPrevioFile, setCertificacionPrevioFile] = useState<File | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      if (!id || isNaN(Number(id))) {
        setError("El ID del evento no es válido.");
        setStep('error');
        setLoading(false);
        return;
      }
      if (loadingUser) return;
      if (!user) {
        navigate('/auth/login');
        return;
      }

      try {
        const { data: eventoData, error: evErr } = await supabase.from('Eventos').select('*').eq('id', Number(id)).single();
        if (evErr || !eventoData) throw new Error(evErr?.message || 'El evento no fue encontrado.');
        setEvento(eventoData as Evento);

        const { data: inscriptionData, error: inscrErr } = await supabase.from('inscripciones').select('*').eq('usuario_id', user.id).eq('evento_id', Number(id)).single();
        if (inscrErr && inscrErr.code !== 'PGRST116') throw inscrErr;
        setCurrentInscription(inscriptionData as Inscripcion || null);

        if (!inscriptionData) {
          if (eventoData.requiere_titulo_tercer_nivel || eventoData.requiere_carta_motivacion || eventoData.requiere_certificacion_previo) setStep('documents');
          else if (eventoData.es_pagado) setStep('payment');
          else setStep('final');
        } else {
          switch (inscriptionData.estado) {
            case 'documentos_rechazados': setStep('documents'); break;
            case 'pendiente_pago': setStep('payment'); break;
            case 'pendiente_aprobacion_documentos':
            case 'pendiente_revision': setStep('review_pending'); break;
            case 'confirmada': setStep('success'); break;
            case 'rechazada': setStep('error'); setError('Tu inscripción ha sido rechazada.'); break;
            default: setStep('error'); setError('Estado de inscripción desconocido.');
          }
        }
      } catch (e: any) {
        setError(e.message);
        setStep('error');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [id, user, loadingUser, navigate]);

  const uploadFile = async (file: File, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const filePath = `${user!.id}/${evento!.id}/${folder}_${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from(BUCKET_PAGOS).upload(filePath, file);
    if (error) throw new Error(`Error al subir ${folder}: ${error.message}`);
    const { data } = supabase.storage.from(BUCKET_PAGOS).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleDocumentSubmission = async () => {
    if (!user || !evento) return;
    setIsSubmitting(true);
    setError(null);
    try {
        let updateFields: Partial<Inscripcion> = {};
        if (tituloTercerNivelFile) {
            updateFields.titulo_tercer_nivel_url = await uploadFile(tituloTercerNivelFile, 'titulo');
            updateFields.titulo_tercer_nivel_estado = 'pendiente';
        }
        if (cartaMotivacionFile) {
            updateFields.carta_motivacion_url = await uploadFile(cartaMotivacionFile, 'carta');
            updateFields.carta_motivacion_estado = 'pendiente';
        }
        if (certificacionPrevioFile) {
            updateFields.certificacion_previo_url = await uploadFile(certificacionPrevioFile, 'certificacion');
            updateFields.certificacion_previo_estado = 'pendiente';
        }

        if (currentInscription) {
            const { error } = await supabase.from('inscripciones').update({ ...updateFields, estado: 'pendiente_aprobacion_documentos' }).eq('id', currentInscription.id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('inscripciones').insert({ usuario_id: user.id, evento_id: evento.id, estado: 'pendiente_aprobacion_documentos', ...updateFields });
            if (error) throw error;
        }
        setStep('review_pending');
    } catch (e: any) {
        setError(e.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handlePaymentSubmission = async () => {
    if (!user || !evento || !receiptFile || !currentInscription) { setError('Se requiere el comprobante de pago.'); return; }
    setIsSubmitting(true); setError(null);
    try {
      const comprobanteUrl = await uploadFile(receiptFile, 'comprobante_pago');
      
      const { error: pagoError } = await supabase.from('pagos').insert({
        inscripcion_id: currentInscription.id,
        comprobante_url: comprobanteUrl,
        estado: 'en_revision'
      });
      if (pagoError) throw pagoError;

      const { error: updateError } = await supabase.from('inscripciones').update({ estado: 'pendiente_revision' }).eq('id', currentInscription!.id);
      if (updateError) throw updateError;

      setStep('review_pending');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFreeEventInscription = async () => {
    if (!user || !evento) return;
    setIsSubmitting(true); setError(null);
    try {
      const { error } = await supabase.from('inscripciones').insert({ usuario_id: user.id, evento_id: evento.id, estado: 'confirmada' });
      if (error) throw error;
      setStep('success');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDocumentInput = (docKey: keyof Omit<Inscripcion, 'id' | 'usuario_id' | 'evento_id' | 'estado' | 'fecha_inscripcion' | 'nota_final' | 'asistencia' | 'certificado_url' | 'perfiles' | 'created_at'>, label: string, setFile: (file: File | null) => void) => {
    if (!evento?.[`requiere_${docKey}`] || currentInscription?.[`${docKey}_estado`] === 'aprobado') return null;

    const status = currentInscription?.[`${docKey}_estado`];
    const reason = currentInscription?.[`${docKey}_motivo_rechazo`];
    
    return (
        <div key={docKey} className="mt-4">
            {status === 'rechazado' && (
                <Alert color="failure" icon={HiOutlineExclamationCircle} className="mb-2">
                    {label} Rechazado: {reason || 'Motivo no especificado.'} Por favor, resube el documento.
                </Alert>
            )}
            <Label htmlFor={docKey} value={`${label} (PDF/Imagen)`} color={status === 'rechazado' ? 'failure' : 'gray'} />
            <FileInput id={docKey} accept="image/*,.pdf" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} required />
        </div>
    );
  };
  
  const renderStep = () => {
    switch (step) {
      case 'documents':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Paso 1: Subir Documentos Requeridos</h2>
            {renderDocumentInput('titulo_tercer_nivel', 'Título de Tercer Nivel', setTituloTercerNivelFile)}
            {renderDocumentInput('carta_motivacion', 'Carta de Motivación', setCartaMotivacionFile)}
            {renderDocumentInput('certificacion_previo', 'Certificación de Curso Previo', setCertificacionPrevioFile)}
          </div>
        );
      case 'payment':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Paso 2: Realizar Pago</h2>
            <Alert color="info" icon={HiInformationCircle}>Costo: ${evento!.costo}</Alert>
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700">
                <h3 className="font-semibold text-lg mb-2">Datos para el Depósito/Transferencia</h3>
                <p><strong>Nombre del Beneficiario:</strong> Centro de Educación Continua - FISEI</p>
                <p><strong>Número de Cuenta:</strong> 1234567890</p>
                <p><strong>Banco:</strong> Banco del Pacífico</p>
                <p><strong>Tipo de Cuenta:</strong> Ahorros</p>
                <p className="mt-2 text-sm">Una vez realizado el pago, por favor, sube tu comprobante a continuación.</p>
            </div>
            <div className="mt-4">
              <Label htmlFor="receipt-upload" value="Archivo del Comprobante (PDF/Imagen)" />
              <FileInput id="receipt-upload" accept="image/*,.pdf" onChange={(e) => setReceiptFile(e.target.files ? e.target.files[0] : null)} required />
            </div>
          </div>
        );
      case 'final':
        return <Alert color="info">Este evento es gratuito. Haz clic para finalizar tu inscripción.</Alert>;
      case 'review_pending':
        return <Alert color="info" icon={HiDocumentText}>Tu inscripción está en revisión.</Alert>;
      case 'success':
        return (
          <div className="text-center">
            <HiCheckCircle className="mx-auto mb-4 h-14 w-14 text-green-500" />
            <h2 className="text-2xl font-semibold">¡Inscripción Exitosa!</h2>
          </div>
        );
      default: return null;
    }
  };

  const getButtonAction = () => {
    switch (step) {
      case 'documents': return handleDocumentSubmission;
      case 'payment': return handlePaymentSubmission;
      case 'final': return handleFreeEventInscription;
      default: return () => {};
    }
  };

  if (loading || loadingUser) return <div className="flex justify-center items-center h-[60vh]"><Spinner size="xl" /></div>;
  if (error) return <Alert color="failure">{error}</Alert>;
  if (!evento) return <Alert color="warning">Evento no encontrado.</Alert>;

  return (
    <div className="container mx-auto p-4">
      <Card>
        <h1 className="text-2xl font-semibold">Inscripción a: {evento.nombre}</h1>
        <hr className="my-4" />
        {renderStep()}
        {!['success', 'review_pending', 'error'].includes(step) && (
          <div className="mt-8 flex justify-end gap-4">
              <Button color="gray" onClick={() => navigate(-1)} disabled={isSubmitting}>Cancelar</Button>
              <Button color="primary" onClick={getButtonAction()} isProcessing={isSubmitting} disabled={isSubmitting}>
                  {step === 'documents' ? 'Enviar Documentos' : step === 'payment' ? 'Enviar Comprobante' : 'Finalizar Inscripción'}
              </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default InscripcionWizard;