export interface PerfilSimple {
    id: string;
    cedula: string;
    nombre1: string;
    apellido1: string;
}

export interface Carrera {
  id: number;
  nombre: string;
}

export interface Evento {
  id: number;
  nombre: string;
  estado: string;
  descripcion?: string;
  imagen_url?: string;
  tipo?: 'curso' | 'conferencia' | 'congreso' | 'webinar' | 'socializacion' | 'otro';
  es_pagado: boolean;
  costo?: number;
  audiencia: 'publico_general' | 'estudiantes_uta' | 'estudiantes_facultad' | 'estudiantes_carrera';
  carreras: Carrera[];
  
  responsable_id?: string;
  responsable?: PerfilSimple | null;
  docente_id?: string;
  docente?: PerfilSimple | null;

  fecha_inicio_evento?: string;
  fecha_fin_evento?: string;
  fecha_inicio_inscripcion?: string;
  fecha_fin_inscripcion?: string;
  
  genera_certificado?: boolean;
  numero_horas?: number;
  requiere_asistencia?: boolean;
  asistencia_minima?: number;
  requiere_nota?: boolean;
  nota_aprobacion?: number;
  requiere_titulo_tercer_nivel?: boolean;
  requiere_carta_motivacion?: boolean;
  requiere_certificacion_previo?: boolean;
}

export interface Inscripcion {
  id: number;
  usuario_id: string;
  evento_id: number;
  estado: 'pendiente_requisitos' | 'pendiente_pago' | 'pendiente_aprobacion_documentos' | 'documentos_rechazados' | 'pendiente_revision' | 'confirmada' | 'rechazada';
  fecha_inscripcion?: string;
  nota_final?: number;
  asistencia?: number;
  certificado_url?: string;
  tipo_certificado?: 'aprobacion' | 'participacion';
  comprobante_pago_url?: string;
  titulo_tercer_nivel_url?: string;
  titulo_tercer_nivel_estado?: 'aprobado' | 'rechazado' | 'pendiente' | 'no_requerido';
  titulo_tercer_nivel_motivo_rechazo?: string;
  carta_motivacion_url?: string;
  carta_motivacion_estado?: 'aprobado' | 'rechazado' | 'pendiente' | 'no_requerido';
  carta_motivacion_motivo_rechazo?: string;
  certificacion_previo_url?: string;
  certificacion_previo_estado?: 'aprobado' | 'rechazado' | 'pendiente' | 'no_requerido';
  certificacion_previo_motivo_rechazo?: string;
  perfiles: PerfilSimple;
  created_at: string;
}