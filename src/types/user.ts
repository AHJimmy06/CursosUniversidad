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
  rol: 'general' | 'administrador';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export type User = UserProfile;
