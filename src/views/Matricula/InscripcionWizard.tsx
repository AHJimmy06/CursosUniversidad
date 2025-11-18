import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, FileInput, Label, Spinner } from 'flowbite-react';
import { supabase } from 'src/utils/supabaseClient';
import { useUser } from 'src/contexts/UserContext';
import { Evento } from 'src/types/eventos';
import { HiCheckCircle, HiReceiptRefund } from 'react-icons/hi';

const BUCKET_PAGOS = (import.meta.env.VITE_STORAGE_BUCKET_PAGOS as string) || 'comprobantes-pago';

const InscripcionWizard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: loadingUser } = useUser();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!id || isNaN(Number(id))) throw new Error('Evento no válido.');
        if (loadingUser) return;
        if (!user) {
          navigate('/auth/login');
          return;
        }

        const { data: eventoData, error: evErr } = await supabase
          .from('Eventos')
          .select('*')
          .eq('id', Number(id))
          .single();
        
        if (evErr) throw evErr;
        if (!eventoData) throw new Error('El evento no fue encontrado.');
        if (!eventoData.es_pagado) {
            // Si el evento es gratuito, redirigir o manejarlo. Por ahora, mostramos error.
            // Idealmente, la lógica para inscribirse a eventos gratis sería diferente.
            throw new Error('Este asistente es solo para la inscripción a eventos de pago.');
        }

        setEvento(eventoData as Evento);

      } catch (e: any) {
        setError(e.message || 'Error al iniciar el proceso de inscripción.');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [id, user, loadingUser, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!receiptFile || !user || !evento) {
      setError('Se requiere un archivo de comprobante.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Subir el archivo
      const fileExt = receiptFile.name.split('.').pop();
      const filePath = `${user.id}/${evento.id}/comprobante_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_PAGOS)
        .upload(filePath, receiptFile);

      if (uploadError) throw uploadError;

      // 2. Obtener la URL pública
      const { data: urlData } = supabase.storage.from(BUCKET_PAGOS).getPublicUrl(filePath);
      const comprobanteUrl = urlData.publicUrl;

      // 3. Llamar a la función RPC para crear la inscripción y el pago
      const { error: rpcError } = await supabase.rpc('enroll_paid_event', {
        p_user_id: user.id,
        p_event_id: evento.id,
        p_comprobante_url: comprobanteUrl,
      });

      if (rpcError) throw rpcError;

      // 4. Éxito
      setSuccess(true);

    } catch (e: any) {
      setError(e.message || 'Ocurrió un error al finalizar la inscripción.');
      // Opcional: intentar borrar el archivo subido si la RPC falla
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || loadingUser) {
    return <div className="flex justify-center items-center h-[60vh]"><Spinner size="xl" /></div>;
  }

  if (error) {
    return <div className="container mx-auto p-4"><Alert color="failure">{error}</Alert></div>;
  }

  if (success) {
    return (
        <div className="container mx-auto p-4">
            <Card>
                <div className="flex flex-col items-center p-8">
                    <HiCheckCircle className="h-16 w-16 text-green-500 mb-4" />
                    <h2 className="text-2xl font-semibold mb-2">¡Inscripción Enviada!</h2>
                    <p className="text-gray-600 text-center mb-6">
                        Tu solicitud de inscripción y comprobante de pago han sido enviados correctamente. <br/>
                        El estado de tu inscripción será revisado por un administrador.
                    </p>
                    <Button onClick={() => navigate('/estudiante/mis-eventos')}>Ver Mis Eventos</Button>
                </div>
            </Card>
        </div>
    );
  }

  if (!evento) return null;

  return (
    <div className="container mx-auto p-4">
      <Card>
        <h1 className="text-2xl font-semibold">Inscripción a: {evento.nombre}</h1>
        <p className="text-lg font-medium text-gray-700">Costo: ${evento.costo}</p>
        <hr className="my-4" />

        <div className="space-y-4">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <HiReceiptRefund className="h-6 w-6 text-gray-600" />
                    <h2 className="text-lg font-semibold">Paso Final: Comprobante de Pago</h2>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                    Para completar tu inscripción, por favor, sube una imagen o PDF de tu comprobante de pago.
                </p>
                <div>
                    <Label htmlFor="receipt-upload" value="Archivo del Comprobante" />
                    <FileInput id="receipt-upload" accept="image/*,.pdf" onChange={handleFileChange} required />
                </div>
            </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
            <Button color="gray" onClick={() => navigate(-1)} disabled={isSubmitting}>
                Cancelar
            </Button>
            <Button 
                color="primary" 
                onClick={handleSubmit} 
                isProcessing={isSubmitting}
                disabled={!receiptFile || isSubmitting}
            >
                Finalizar Inscripción
            </Button>
        </div>
      </Card>
    </div>
  );
};

export default InscripcionWizard;