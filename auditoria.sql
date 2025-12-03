-- Tabla de auditoría para el Módulo de Gestión de Cambios (CDC)
CREATE TABLE public.cdc_audit_log (
    id bigserial PRIMARY KEY,
    solicitud_id int8 NOT NULL,
    actor_id uuid NOT NULL,
    accion text NOT NULL,
    valor_anterior text NULL,
    valor_nuevo text NULL,
    notas text NULL,
    created_at timestamptz DEFAULT now() NOT NULL,

    CONSTRAINT fk_solicitud_id FOREIGN KEY (solicitud_id) REFERENCES public.solicitudes_de_cambio(id) ON DELETE CASCADE,
    CONSTRAINT fk_actor_id FOREIGN KEY (actor_id) REFERENCES public.perfiles(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.cdc_audit_log IS 'Registra un historial de todas las acciones importantes realizadas en una solicitud de cambio.';
COMMENT ON COLUMN public.cdc_audit_log.solicitud_id IS 'Referencia a la solicitud de cambio afectada.';
COMMENT ON COLUMN public.cdc_audit_log.actor_id IS 'El usuario que realizó la acción.';
COMMENT ON COLUMN public.cdc_audit_log.accion IS 'Una clave que describe la acción realizada (ej: "ESTADO_CAMBIADO", "ASIGNACION_MIEMBRO").';
COMMENT ON COLUMN public.cdc_audit_log.valor_anterior IS 'El valor del campo antes del cambio (si aplica).';
COMMENT ON COLUMN public.cdc_audit_log.valor_nuevo IS 'El valor del campo después del cambio (si aplica).';
COMMENT ON COLUMN public.cdc_audit_log.notas IS 'Información contextual adicional sobre la acción.';
COMMENT ON COLUMN public.cdc_audit_log.created_at IS 'La fecha y hora exactas en que ocurrió la acción.';
