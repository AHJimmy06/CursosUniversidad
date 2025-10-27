export interface UserProfile {
  id: string;
  nombre1: string;
  nombre2?: string;
  apellido1: string;
  apellido2?: string;
  cedula: string;
  telefono: string;
  email: string;
  fecha_nacimiento: string;
  rol_usuario: 'general' | 'administrador';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface EventWithResponsible {
  id: number;
  nombre: string;
  estado: string;
  responsable_uuid: string;
  responsable_info: {
    cedula: string;
    nombre: string;
    apellido: string;
    correo?: string;
  };
}

export interface Event {
  id: number;
  created_at: string;
  updated_at: string;
  nombre: string;
  descripcion?: string;
  estado: string;
  responsable_id: string;
  docente_id?: string;
  tipo_evento: string;
  fecha_inicio_evento: string;
  fecha_fin_evento: string;
  fecha_inicio_inscripcion: string;
  fecha_fin_inscripcion: string;
  es_pagado: boolean;
  costo: number;
  genera_certificado: boolean;
  numero_horas: number;
  nota_aprobacion: number;
  audiencia: string;
}
