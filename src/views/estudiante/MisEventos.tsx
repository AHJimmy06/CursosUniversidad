import { useEffect, useState } from 'react';
import { supabase } from 'src/utils/supabaseClient';
import { Evento, Inscripcion } from 'src/types/eventos';
import EventoCard from 'src/views/catalogo/components/EventoCard';
import { Spinner, Alert, Button } from 'flowbite-react';
import { Link } from 'react-router-dom';
import { HiExclamation } from 'react-icons/hi';

type InscripcionConPago = Omit<Inscripcion, 'perfiles' | 'created_at'> & {
  pagos: {
    estado: string;
    motivo_rechazo: string | null;
  }[];
  Eventos: Evento;
};

const MisEventos = () => {
  const [inscripciones, setInscripciones] = useState<InscripcionConPago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventosInscritos = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuario no autenticado');

        const { data, error: inscripcionesError } = await supabase
          .from('inscripciones')
          .select(
            `
            *,
            pagos ( estado, motivo_rechazo ),
            Eventos:evento_id ( *, carreras(id, nombre) )
          `
          )
          .eq('usuario_id', user.id);

        if (inscripcionesError) throw inscripcionesError;

        setInscripciones((data || []) as unknown as InscripcionConPago[]);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchEventosInscritos();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="xl" />
        <span className="pl-3">Cargando mis eventos...</span>
      </div>
    );
  }

  if (error) {
    return <Alert color="failure">Error al cargar los datos: {error}</Alert>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Mis Eventos Inscritos</h2>
      {inscripciones.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {inscripciones.map(({ Eventos: evento, ...inscripcion }) => {
            if (!evento) return null;

            const pagoRechazado =
              inscripcion.estado === 'pendiente_pago' &&
              inscripcion.pagos &&
              inscripcion.pagos.length > 0 &&
              inscripcion.pagos[0].estado === 'rechazado';
            
            const showDownloadButton = evento.estado === 'finalizado' && !!inscripcion.certificado_url;

            return (
              <div key={evento.id} className="relative">
                {pagoRechazado && (
                  <Alert color="failure" icon={HiExclamation} className="mb-2">
                    <h3 className="font-semibold">Pago Rechazado</h3>
                    <p className="text-sm mb-2">
                      {inscripcion.pagos[0].motivo_rechazo || 'No se especificó un motivo.'}
                    </p>
                    <Button as={Link} to={`/evento/${evento.id}/inscripcion`} size="xs">
                      Corregir Pago
                    </Button>
                  </Alert>
                )}
                <EventoCard 
                  evento={evento} 
                  showDownloadCertificateButton={showDownloadButton}
                  certificateUrl={inscripcion.certificado_url}
                  certificateType={inscripcion.tipo_certificado}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-lg text-gray-500 mb-4">Parece que aún no te has inscrito en ningún evento. ¡Explora nuestro catálogo y encuentra algo de tu interés!</p>
          <Button as={Link} to="/catalogo" color="primary">
            Explorar Eventos
          </Button>
        </div>
      )}
    </div>
  );
};

export default MisEventos;
