-- Nueva enumeración para el estado de aprobación del ECAB
CREATE TYPE public.estado_aprobacion_ecab AS ENUM (
    'pendiente_aprobacion_ecab',
    'aprobado_ecab',
    'rechazado_ecab'
);

-- Tabla para definir los comités de emergencia (ECAB)
CREATE TABLE public.ecab_committees (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT
);

COMMENT ON TABLE public.ecab_committees IS 'Define los comités de aprobación de cambios de emergencia (ECAB).';

-- Tabla de enlace para los miembros del ECAB
CREATE TABLE public.ecab_members (
    committee_id INT NOT NULL,
    usuario_id UUID NOT NULL,
    PRIMARY KEY (committee_id, usuario_id),
    FOREIGN KEY (committee_id) REFERENCES public.ecab_committees(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES public.perfiles(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.ecab_members IS 'Asigna usuarios a un comité de emergencia (ECAB).';

-- Modificar la tabla de solicitudes de cambio para incluir el estado de aprobación del ECAB
ALTER TABLE public.solicitudes_de_cambio
ADD COLUMN estado_ecab public.estado_aprobacion_ecab;

COMMENT ON COLUMN public.solicitudes_de_cambio.estado_ecab IS 'Estado de la aprobación por parte del Comité de Emergencia (ECAB).';
