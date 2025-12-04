import React, { useEffect, useState } from 'react';
import { supabase } from 'src/utils/supabaseClient';
import { useUser } from 'src/contexts/UserContext';
import { Alert, Button, Card, Spinner, Table, Modal, Checkbox, Label, Textarea } from 'flowbite-react';
import { HiCheck, HiX, HiDownload } from 'react-icons/hi';
import { Evento, Inscripcion } from 'src/types/eventos';
import { useParams } from 'react-router-dom';

const ApproveDocuments: React.FC = () => {
  const { user } = useUser();
  const { eventoId } = useParams<{ eventoId: string }>();
  
  const [inscriptions, setInscriptions] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedInscription, setSelectedInscription] = useState<Inscripcion | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const fetchInscriptions = async () => {
    if (!user || !eventoId) return;

    setLoading(true);
    setError(null);
    try {
      const { data, error: inscriptionsError } = await supabase
        .from('inscripciones')
        .select('*, perfiles ( nombre1, apellido1, cedula )')
        .eq('evento_id', eventoId)
        .eq('estado', 'pendiente_aprobacion_documentos');

      if (inscriptionsError) throw inscriptionsError;

      setInscriptions(data as Inscripcion[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInscriptions();
  }, [user, eventoId]);

  const openReviewModal = (inscription: Inscripcion) => {
    setSelectedInscription(inscription);
    setIsModalOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[60vh]"><Spinner size="xl" /></div>;
  }

  if (error) {
    return <Alert color="failure">Error: {error}</Alert>;
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Aprobación de Documentos de Inscripción</h1>

      {inscriptions.length === 0 ? (
        <Alert color="info">No hay documentos pendientes de revisión para este evento.</Alert>
      ) : (
        <Table hoverable>
          <Table.Head>
            <Table.HeadCell>Estudiante</Table.HeadCell>
            <Table.HeadCell>Cédula</Table.HeadCell>
            <Table.HeadCell>Fecha Solicitud</Table.HeadCell>
            <Table.HeadCell>Acciones</Table.HeadCell>
          </Table.Head>
          <Table.Body>
            {inscriptions.map(inscription => (
              <Table.Row key={inscription.id}>
                <Table.Cell>{`${inscription.perfiles.nombre1} ${inscription.perfiles.apellido1}`}</Table.Cell>
                <Table.Cell>{inscription.perfiles.cedula}</Table.Cell>
                <Table.Cell>{new Date(inscription.created_at).toLocaleDateString()}</Table.Cell>
                <Table.Cell>
                  <Button size="sm" onClick={() => openReviewModal(inscription)}>
                    Revisar Documentos
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      {selectedInscription && (
        <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <Modal.Header>Revisión de Documentos</Modal.Header>
          <Modal.Body>
            {/* Document review content will be re-implemented here */}
          </Modal.Body>
          <Modal.Footer>
            <Button>Guardar Revisión</Button>
            <Button color="gray" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default ApproveDocuments;