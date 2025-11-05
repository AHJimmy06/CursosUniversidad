# Storage privado para comprobantes de pago

Este proyecto integra comprobantes de pago en un bucket PRIVADO de Supabase Storage usando URLs firmadas (signed URLs) y políticas RLS.

## Variables de entorno

En tu `.env.local` (Vite):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_STORAGE_BUCKET_PAGOS=comprobantes-pago
VITE_STORAGE_BUCKET_INSCRIPCIONES=eventos
```

- `comprobantes-pago` debe ser un bucket PRIVADO.
- `eventos` puede ser público o privado, según tu estrategia para requisitos/documentos.

## Políticas RLS (pagos)

Crea el bucket `comprobantes-pago` y aplica estas políticas (ajusta nombres si usas otro schema/enum):

```sql
CREATE POLICY "Permitir subida a dueños de inscripcion"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'comprobantes-pago'
  AND (
    (SELECT usuario_id FROM public.inscripciones WHERE id = (path_tokens[1])::bigint) = auth.uid()
  )
);

CREATE POLICY "Permitir descarga a dueños, administrador y responsables"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'comprobantes-pago'
  AND (
    (SELECT usuario_id FROM public.inscripciones WHERE id = (path_tokens[1])::bigint) = auth.uid()
    OR (SELECT rol FROM public.perfiles WHERE id = auth.uid()) = 'administrador'::public.rol_usuario
    OR auth.uid() = (
      SELECT evt.responsable_id
      FROM public.inscripciones i
      JOIN public."Eventos" evt ON i.evento_id = evt.id
      WHERE i.id = (path_tokens[1])::bigint
    )
  )
);

CREATE POLICY "Permitir actualización a dueños de inscripcion"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'comprobantes-pago'
  AND (
    (SELECT usuario_id FROM public.inscripciones WHERE id = (path_tokens[1])::bigint) = auth.uid()
  )
);

CREATE POLICY "Permitir borrado a dueños y administrador"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'comprobantes-pago'
  AND (
    (SELECT usuario_id FROM public.inscripciones WHERE id = (path_tokens[1])::bigint) = auth.uid()
    OR (SELECT rol FROM public.perfiles WHERE id = auth.uid()) = 'administrador'::public.rol_usuario
  )
);
```

Estas políticas esperan que los archivos se suban en una ruta con el patrón:

```
<inscripcion_id>/comprobante_<timestamp>.<ext>
```

## Prácticas en el código

- Al subir un comprobante de pago, se guarda en la base de datos la RUTA (path) del archivo, no una URL pública.
- Para visualizar/descargar, el cliente genera un signed URL temporal vía:
  - `supabase.storage.from('comprobantes-pago').createSignedUrl(<path>, 300)`.
- En el panel de Docente, el botón "Descargar Comprobante" genera y abre el signed URL bajo demanda.

## Estados de inscripción

- Eventos gratuitos sin requisitos: `pendiente_revision`.
- Eventos pagados sin evidencia: `pendiente_pago`.
- Cuando se completan requisitos (si existen) y hay evidencia de pago (si aplica): `pendiente_revision`.

Puedes ajustar estos estados si manejas un enum con más granularidad (p.ej. `pendiente_documentos`).
