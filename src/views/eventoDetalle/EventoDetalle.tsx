import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { Evento } from '../../types/eventos';
import { Alert, Spinner, Card, Badge, Button } from 'flowbite-react';
import { HiCalendar, HiOutlineClock, HiUser, HiIdentification, HiOutlineSparkles, HiInformationCircle, HiOutlinePhotograph } from 'react-icons/hi';
import { jsPDF } from 'jspdf';

const EventoDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState('');
  const [enrollmentStatus, setEnrollmentStatus] = useState<string | null>(null);
  const [isEventFinished, setIsEventFinished] = useState(false);
  const [notaFinal, setNotaFinal] = useState<number | null>(null);
  const [asistencia, setAsistencia] = useState<number | null>(null);
  const [studentName, setStudentName] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchEvento = async () => {
      if (!id || isNaN(Number(id))) {
        setError("El ID del evento no es válido.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('perfiles')
            .select('nombre1, apellido1')
            .eq('id', user.id)
            .single();

          if (profileError) throw profileError;
          setStudentName(`${profile.nombre1} ${profile.apellido1}`);
        }

        const { data, error: dbError } = await supabase
          .from('Eventos')
          .select(`
            *,
            responsable:perfiles!responsable_id(id, nombre1, apellido1),
            docente:perfiles!docente_id(id, nombre1, apellido1)
          `)
          .eq('id', id)
          .single();

        if (dbError) {
          if (dbError.code === 'PGRST116') throw new Error('El evento que buscas no existe.');
          throw dbError;
        }
        
        setEvento(data);
        checkRegistrationStatus(data);
        checkEventFinished(data);

        if (user && data) {
          const { data: inscriptionData, error: inscriptionError } = await supabase
            .from('inscripciones')
            .select('estado, nota_final, asistencia')
            .eq('usuario_id', user.id)
            .eq('evento_id', data.id)
            .single();

          if (inscriptionError && inscriptionError.code !== 'PGRST116') { 
            throw inscriptionError;
          }

          if (inscriptionData) {
            setEnrollmentStatus(inscriptionData.estado);
            setNotaFinal(inscriptionData.nota_final);
            setAsistencia(inscriptionData.asistencia);
          }
        }

      } catch (err: any) {
        setError(err.message || 'Ocurrió un error inesperado.');
      } finally {
        setLoading(false);
      }
    };

    const checkRegistrationStatus = (eventData: Evento) => {
      if (!eventData.fecha_inicio_inscripcion || !eventData.fecha_fin_inscripcion) {
        setIsRegistrationOpen(false);
        setRegistrationMessage('Fechas de inscripción no definidas');
        return;
      }
      const now = new Date();
      const startDate = new Date(eventData.fecha_inicio_inscripcion);
      const endDate = new Date(eventData.fecha_fin_inscripcion);

      if (now < startDate) {
        setIsRegistrationOpen(false);
        setRegistrationMessage('Inscripciones abren pronto');
      } else if (now > endDate) {
        setIsRegistrationOpen(false);
        setRegistrationMessage('Inscripciones cerradas');
      } else {
        setIsRegistrationOpen(true);
        setRegistrationMessage('Inscribirse ahora');
      }
    };

    const checkEventFinished = (eventData: Evento) => {
        if (!eventData.fecha_fin_evento) {
            setIsEventFinished(false);
            return;
        }
        const now = new Date();
        const endDate = new Date(eventData.fecha_fin_evento);
        if (now > endDate) {
            setIsEventFinished(true);
        }
    }

    fetchEvento();
  }, [id]);

  const handleGenerateCertificate = () => {
    const canvas = canvasRef.current;
    if (!canvas || !evento || !evento.docente) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const template = new Image();
    template.crossOrigin = 'anonymous'; 
    template.src = '/Certificado.png'; 
    template.onload = () => {
        canvas.width = template.width;
        canvas.height = template.height;
        ctx.drawImage(template, 0, 0);

        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';

        // 1. Nombre del estudiante
        ctx.font = '80px Times New Roman';
        ctx.fillText(studentName, canvas.width / 2, 720);

        // 2. Detalles del evento
        ctx.font = '45px Times New Roman';
        ctx.fillText(`Por haber completado exitosamente el curso de "${evento.nombre}"`, canvas.width / 2, 850);
        
        // 3. Nombre del docente
        ctx.font = '38px Times New Roman';
        if (evento.docente) {
          ctx.fillText(`${evento.docente.nombre1} ${evento.docente.apellido1}`, canvas.width / 2, 1050);
        }
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`Certificado-${evento.nombre}.pdf`);
    };
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const renderPriceOrStatus = () => {
    if (isEventFinished) {
        return <Badge color="gray" size="lg">Evento Finalizado</Badge>
    }
    if (enrollmentStatus) {
      return <Badge color="success" size="sm" className="capitalize">{enrollmentStatus}</Badge>
    }
    return (
        <Badge size="lg" color={evento?.es_pagado ? 'warning' : 'success'} className="mt-2 md:mt-0">
            {evento?.es_pagado ? `Costo: $${evento.costo}` : 'Gratuito'}
        </Badge>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="xl" /> <span className="pl-3 text-lg">Cargando evento...</span>
      </div>
    );
  }

  if (error) {
    return <Alert color="failure" icon={HiInformationCircle}><span className="font-medium">Error:</span> {error}</Alert>;
  }
  
  if (!evento) {
      return <Alert color="warning">No se encontró información para este evento.</Alert>;
  }

  const isDocente = currentUser && evento && evento.docente && currentUser.id === evento.docente.id;

  return (
    <div className="container mx-auto p-4">
      <div
        className="w-full h-80 bg-gray-200 rounded-lg mb-6 shadow-lg bg-cover bg-center"
        style={{
          backgroundImage: evento.imagen_url ? `url(${evento.imagen_url})` : 'none',
        }}
      >
        {!evento.imagen_url && (
          <div className="w-full h-full flex items-center justify-center">
            <HiOutlinePhotograph className="text-gray-400 text-5xl" />
          </div>
        )}
      </div>

      <Card>
        <div className="flex flex-col md:flex-row justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{evento.nombre}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge color="cyan" size="sm" className="inline-block capitalize">{evento.tipo?.replace('_', ' ')}</Badge>
            </div>
          </div>
          {renderPriceOrStatus()}
        </div>

        <p className="text-lg text-gray-600 dark:text-gray-400 my-4">
          {evento.descripcion || "Este evento no tiene una descripción detallada."}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t pt-6">
            <div className="space-y-3">
                <h3 className="text-xl font-semibold border-b pb-2">Fechas del Evento</h3>
                <p className="flex items-center gap-2"><HiCalendar /> <b>Inicia:</b> {formatDate(evento.fecha_inicio_evento)}</p>
                <p className="flex items-center gap-2"><HiCalendar /> <b>Finaliza:</b> {formatDate(evento.fecha_fin_evento)}</p>
            </div>
            <div className="space-y-3">
                <h3 className="text-xl font-semibold border-b pb-2">Período de Inscripción</h3>
                <p className="flex items-center gap-2"><HiCalendar /> <b>Apertura:</b> {formatDate(evento.fecha_inicio_inscripcion)}</p>
                <p className="flex items-center gap-2"><HiCalendar /> <b>Cierre:</b> {formatDate(evento.fecha_fin_inscripcion)}</p>
            </div>
            <div className="space-y-3">
                <h3 className="text-xl font-semibold border-b pb-2">Detalles Académicos</h3>
                {evento.numero_horas && <p className="flex items-center gap-2"><HiOutlineClock /> <b>Duración:</b> {evento.numero_horas} horas</p>}
                {evento.genera_certificado && <p className="flex items-center gap-2"><HiOutlineSparkles /> Otorga certificado.</p>}
                {evento.responsable && <p className="flex items-center gap-2"><HiUser /> <b>Responsable:</b> {`${evento.responsable.nombre1} ${evento.responsable.apellido1}`}</p>}
                {evento.docente && <p className="flex items-center gap-2"><HiIdentification /> <b>Docente:</b> {`${evento.docente.nombre1} ${evento.docente.apellido1}`}</p>}
            </div>
        </div>
        
        {(notaFinal !== null || asistencia !== null) && (
            <div className="mt-8 border-t pt-6">
                <h3 className="text-xl font-semibold border-b pb-2">Resultados Académicos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
                    <div className="space-y-3">
                        {notaFinal !== null && <p><b>Nota Final:</b> {notaFinal}</p>}
                    </div>
                    <div className="space-y-3">
                        {asistencia !== null && <p><b>Asistencia:</b> {asistencia}%</p>}
                    </div>
                    {(() => {
                        const notaAprobacion = evento?.nota_aprobacion;
                        if (notaFinal !== null && notaAprobacion != null && notaFinal >= notaAprobacion) {
                            return (
                                <div className="space-y-3">
                                    <Button onClick={handleGenerateCertificate}>Imprimir Certificado</Button>
                                </div>
                            );
                        }
                        return null;
                    })()}
                </div>
            </div>
        )}       
        {!enrollmentStatus && !isEventFinished && !isDocente && (
            <div className="mt-8 flex justify-end">
                <Button 
                    color={isRegistrationOpen ? 'success' : 'gray'} 
                    disabled={!isRegistrationOpen}
                    size="lg"
                    onClick={() => navigate(`/evento/${evento.id}/inscripcion`)}
                >
                    {registrationMessage}
                </Button>
            </div>
        )}
        {enrollmentStatus === 'documentos_rechazados' && (
            <div className="mt-8 flex justify-end">
                <Button 
                    color="warning" 
                    size="lg"
                    onClick={() => navigate(`/evento/${evento.id}/inscripcion`)}
                >
                    Reenviar Solicitud
                </Button>
            </div>
        )}
        {enrollmentStatus === 'pendiente_pago' && (
            <div className="mt-8 flex justify-end">
                <Button 
                    color="success" 
                    size="lg"
                    onClick={() => navigate(`/evento/${evento.id}/inscripcion`)}
                >
                    Realizar Pago
                </Button>
            </div>
        )}
      </Card>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
  </div>
  );
};

export default EventoDetalle;