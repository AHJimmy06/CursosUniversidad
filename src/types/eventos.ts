// Esta es la definición ÚNICA y CORRECTA de un Evento.
// Todos los componentes la importarán.
export interface Evento {
    id: number;
    nombre: string;
    estado: string; // 'activo', 'inactivo', etc.
    responsable_id: string | null; // El UUID que se guarda en la DB
    
    // El objeto anidado que se obtiene de la consulta para MOSTRAR datos
    responsable?: {
      cedula: string;
      nombre1: string;
      apellido1: string;
    } | null;
  }