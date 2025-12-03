export type ChangeRequestStatus = 
  | 'borrador' 
  | 'pendiente_revision' 
  | 'pendiente_cab' 
  | 'aprobada' 
  | 'en_progreso' 
  | 'completada' 
  | 'rechazada' 
  | 'cancelada'
  | 'pendiente_pir'
  | 'cerrada';

export type ChangeRequestPriority = 'baja' | 'media' | 'alta' | 'critica';

export type ChangeRequestModel = 'estandar' | 'normal' | 'emergencia';

export interface SolicitudDeCambio {
  id: number;
  titulo: string;
  descripcion: string;
  justificacion: string;
  impacto_potencial: string;
  solicitante_id: string;
  gestor_id: string;
  estado: ChangeRequestStatus;
  prioridad: ChangeRequestPriority;
  modelo: ChangeRequestModel;
  github_issue_url: string;
  github_issue_number: number;
  github_pr_url: string;
  created_at: string;
  updated_at: string;
  solicitante: {
    nombre1: string;
    apellido1: string;
  } | null;
  estado_ecab?: string;
}

export interface RfcPir {
    id?: number;
    solicitud_id: number;
    revisor_id: string;
    exitoso: boolean;
    notas: string;
    created_at?: string;
}
