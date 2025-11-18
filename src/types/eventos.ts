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
  nota_aprobacion?: number;
}