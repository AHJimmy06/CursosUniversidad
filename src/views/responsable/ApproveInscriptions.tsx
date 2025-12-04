import React, { useEffect, useState } from 'react';
import { supabase } from 'src/utils/supabaseClient';
import { useUser } from 'src/contexts/UserContext';
import { Alert, Button, Card, Spinner, Table } from 'flowbite-react';
import { HiCheck, HiX, HiDownload } from 'react-icons/hi';
import { Evento } from 'src/types/eventos'; // Assuming Evento interface is available

interface InscripcionConDocumentos {
  id: number;
  usuario_id: string;
  evento_id: number;
  estado: string;
  created_at: string;
  comprobante_pago_url?: string;
  titulo_tercer_nivel_url?: string;
  carta_motivacion_url?: string;
  certificacion_previo_url?: string;
  perfiles: { // Assuming 'perfiles' is linked via 'usuario_id'
    nombre1: string;
    apellido1: string;
    cedula: string;
  };
  Eventos: Evento; // Link to event details
}

const ApproveInscriptions: React.FC = () => {
  const { user } = useUser();
  const [inscriptions, setInscriptions] = useState<InscripcionConDocumentos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingInscription, setProcessingInscription] = useState<number | null>(null);

  const fetchInscriptions = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      // Fetch events where the current user is responsible
      const { data: responsibleEvents, error: eventsError } = await supabase
        .from('Eventos')
        .select('id')
        .eq('responsable_id', user.id);

      if (eventsError) throw eventsError;
      const eventIds = responsibleEvents?.map(event => event.id) || [];

      if (eventIds.length === 0) {
        setInscriptions([]);
        setLoading(false);
        return;
      }

      // Fetch inscriptions for these events that are 'pendiente_revision'
      const { data: inscriptionsData, error: inscriptionsError } = await supabase
        .from('inscripciones')
        .select(`
          id,
          usuario_id,
          evento_id,
          estado,
          created_at,
          comprobante_pago_url,
          titulo_tercer_nivel_url,
          carta_motivacion_url,
          certificacion_previo_url,
          perfiles ( nombre1, apellido1, cedula ),
          Eventos ( nombre, requiere_titulo_tercer_nivel, requiere_carta_motivacion, requiere_certificacion_previo, es_pagado )
        `)
        .in('evento_id', eventIds)
        .eq('estado', 'pendiente_revision')
        .order('created_at', { ascending: true });

      if (inscriptionsError) throw inscriptionsError;

      setInscriptions(inscriptionsData as unknown as InscripcionConDocumentos[]);

    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching inscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInscriptions();
  }, [user]);

  const handleApprove = async (inscriptionId: number) => {
    setProcessingInscription(inscriptionId);
    try {
      const { error: updateError } = await supabase
        .from('inscripciones')
        .update({ estado: 'aprobado' })
        .eq('id', inscriptionId);

      if (updateError) throw updateError;
      
      // Optionally trigger email/notification to student

      fetchInscriptions(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
      console.error('Error approving inscription:', err);
    } finally {
      setProcessingInscription(null);
    }
  };

  const handleReject = async (inscriptionId: number) => {
    setProcessingInscription(inscriptionId);
    try {
      const { error: updateError } = await supabase
        .from('inscripciones')
        .update({ estado: 'rechazado' })
        .eq('id', inscriptionId);

      if (updateError) throw updateError;
      
      // Optionally trigger email/notification to student

      fetchInscriptions(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
      console.error('Error rejecting inscription:', err);
    } finally {
      setProcessingInscription(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spinner size="xl" />
        <span className="pl-3">Cargando solicitudes de aprobación...</span>
      </div>
    );
  }

  if (error) {
    return <Alert color="failure">Error: {error}</Alert>;
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Solicitudes de Aprobación de Inscripciones</h1>

      {inscriptions.length === 0 ? (
        <Alert color="info">No hay solicitudes de inscripción pendientes para tus eventos.</Alert>
      ) : (
        <Table hoverable>
          <Table.Head>
            <Table.HeadCell>Evento</Table.HeadCell>
            <Table.HeadCell>Estudiante</Table.HeadCell>
            <Table.HeadCell>Cédula</Table.HeadCell>
            <Table.HeadCell>Fecha Solicitud</Table.HeadCell>
            <Table.HeadCell>Documentos</Table.HeadCell>
            <Table.HeadCell>Acciones</Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {inscriptions.map(inscription => (
              <Table.Row key={inscription.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                <Table.Cell className="font-medium text-gray-900 dark:text-white">
                  {inscription.Eventos?.nombre || 'Evento Desconocido'}
                </Table.Cell>
                <Table.Cell>
                  {`${inscription.perfiles.nombre1} ${inscription.perfiles.apellido1}`}
                </Table.Cell>
                <Table.Cell>{inscription.perfiles.cedula}</Table.Cell>
                <Table.Cell>{new Date(inscription.created_at).toLocaleDateString()}</Table.Cell>
                <Table.Cell>
                  <div className="flex flex-col gap-1">
                    {inscription.Eventos?.es_pagado && inscription.comprobante_pago_url && (
                        <Button size="xs" color="blue" href={inscription.comprobante_pago_url} target="_blank" rel="noopener noreferrer">
                            <HiDownload className="mr-2 h-4 w-4" /> Pago
                        </Button>
                    )}
                    {inscription.Eventos?.requiere_titulo_tercer_nivel && inscription.titulo_tercer_nivel_url && (
                        <Button size="xs" color="blue" href={inscription.titulo_tercer_nivel_url} target="_blank" rel="noopener noreferrer">
                            <HiDownload className="mr-2 h-4 w-4" /> Título
                        </Button>
                    )}
                    {inscription.Eventos?.requiere_carta_motivacion && inscription.carta_motivacion_url && (
                        <Button size="xs" color="blue" href={inscription.carta_motivacion_url} target="_blank" rel="noopener noreferrer">
                            <HiDownload className="mr-2 h-4 w-4" /> Carta
                        </Button>
                    )}
                    {inscription.Eventos?.requiere_certificacion_previo && inscription.certificacion_previo_url && (
                        <Button size="xs" color="blue" href={inscription.certificacion_previo_url} target="_blank" rel="noopener noreferrer">
                            <HiDownload className="mr-2 h-4 w-4" /> Cert. Previo
                        </Button>
                    )}
                    {
                      !inscription.Eventos?.es_pagado && 
                      !inscription.Eventos?.requiere_titulo_tercer_nivel && 
                      !inscription.Eventos?.requiere_carta_motivacion && 
                      !inscription.Eventos?.requiere_certificacion_previo &&
                      <span>N/A</span>
                    }
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      color="green" 
                      onClick={() => handleApprove(inscription.id)} 
                      isProcessing={processingInscription === inscription.id}
                      disabled={processingInscription !== null}
                    >
                      <HiCheck className="h-5 w-5" />
                    </Button>
                    <Button 
                      size="sm" 
                      color="red" 
                      onClick={() => handleReject(inscription.id)}
                      isProcessing={processingInscription === inscription.id}
                      disabled={processingInscription !== null}
                    >
                      <HiX className="h-5 w-5" />
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  );
};

export default ApproveInscriptions;