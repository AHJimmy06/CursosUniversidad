import jsPDF from 'jspdf';
import { Evento, PerfilSimple, Inscripcion } from 'src/types/eventos';

export const generateCertificate = (
  student: PerfilSimple,
  event: Evento,
  inscription: Inscripcion,
  certificateType: 'aprobacion' | 'participacion'
): string => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Certificado de', 105, 40, { align: 'center' });
  doc.text(certificateType === 'aprobacion' ? 'Aprobación' : 'Participación', 105, 55, { align: 'center' });

  // Student Name
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('Otorgado a:', 105, 80, { align: 'center' });
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${student.nombre1} ${student.apellido1}`, 105, 95, { align: 'center' });

  // Event Details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Por haber completado el evento:', 105, 120, { align: 'center' });
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(event.nombre, 105, 130, { align: 'center' });

  // Hours
  if (event.numero_horas) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Con una duración de ${event.numero_horas} horas.`, 105, 145, { align: 'center' });
  }
  
  // Date
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Finalizado el: ${new Date(event.fecha_fin_evento || '').toLocaleDateString()}`, 105, 160, { align: 'center' });

  // Signatures
  doc.line(40, 200, 90, 200);
  doc.text('Firma del Responsable', 65, 205, { align: 'center' });
  
  doc.line(120, 200, 170, 200);
  doc.text('Firma del Docente', 145, 205, { align: 'center' });


  // Return as Data URL
  return doc.output('datauristring');
};
