<!-- 
**Título del Pull Request:**
Usa un título claro y conciso siguiendo la convención de commits.
Ejemplos:
- feat: Implementa CRUD de Eventos y control de acceso por rol
- fix: Corrige redirección prematura en login de usuario inactivo
- style: Refina la paleta de colores y la identidad visual
-->

---

### 📝 Descripción General

<!-- 
Describe de manera clara y concisa el propósito e impacto de este Pull Request.
Explica el "porqué" de los cambios, no solo el "qué". ¿Qué problema estratégico soluciona o qué valor de negocio aporta?
Ejemplo: "Esta implementación introduce el sistema de gestión de usuarios en su totalidad, abarcando desde la creación de una cuenta hasta la gestión de los datos personales..."
-->

...

---

### 📜 Resumen de Cambios

<!-- 
Detalla los cambios más importantes agrupándolos por funcionalidad.
Usa emojis para categorizar visualmente cada grupo. Para cada punto, describe la funcionalidad implementada y, si es relevante, la decisión técnica detrás de ella.
-->

#### ✨ Funcionalidad Principal
<!-- Cambios que el usuario final puede ver y con los que puede interactuar. -->
- **[Aspecto Clave 1]:** [Descripción. Ej: **Listado de Eventos:** Se crea la página `/eventos/listar` que muestra todos los eventos en una tabla.]
- **[Aspecto Clave 2]:** [Descripción. Ej: **Edición de Eventos (Update):** Un modal de edición permite a los administradores modificar la información de un evento existente.]
- **[Aspecto Clave 3]:** [Descripción. Ej: **Gestión de Estados (Soft-Delete):** Se ha implementado un sistema de estados (`activo`, `inactivo`) en el menú de "Acciones".]

#### 🛡️ Seguridad y Control de Acceso (RBAC)
<!-- Cambios relacionados con autenticación, permisos y seguridad. -->
- **[Aspecto Clave 1]:** [Descripción. Ej: **Visibilidad del Sidebar:** La lógica del componente `Sidebar` ha sido actualizada para ser dinámica y leer el rol del usuario desde el `UserContext`.]
- **[Aspecto Clave 2]:** [Descripción. Ej: **Restricción de Rutas:** El ítem de menú "Eventos" ahora solo es visible para los usuarios con el rol de `administrador`.]

#### 🔧 Mejoras Técnicas y Arquitectura
<!-- Cambios "bajo el capó": refactorizaciones, mejoras de rendimiento, sistema de tipos, etc. -->
- **[Mejora 1]:** [Descripción. Ej: **Consulta Optimizada:** Se implementó una lógica de carga en el frontend para unir los datos de las tablas `Eventos` y `perfiles` y mostrar nombres en lugar de UUIDs.]
- **[Mejora 2]:** [Descripción. Ej: **Sistema de Tipos Unificado:** Se ha creado el archivo `/types/eventos.ts` para garantizar la consistencia de los datos en toda la aplicación.]

---

### ✅ ¿Cómo se ha probado esto?
<!-- 
Describe los pasos que el revisor debe seguir para probar tus cambios manualmente.
Sé lo más explícito posible.
-->

1. Inicia sesión como un usuario con el rol de `administrador`.
2. Navega a la ruta `/eventos/listar`.
3. Verifica que [comportamiento esperado A].
4. Cierra sesión e inicia como un usuario con rol `general`.
5. Verifica que [comportamiento esperado B].

---

### 🖼️ Resultado Visual de la Funcionalidad
<!-- 
¡Una imagen vale más que mil palabras!
Añade capturas de pantalla o GIFs que demuestren los cambios visuales y la funcionalidad.
-->

**[Descripción de la imagen, ej: Tabla de Eventos mostrando el nombre del responsable]**
*(Arrastra aquí una imagen o GIF)*

**[Descripción de la imagen, ej: Sidebar visible para un Administrador vs. un Usuario General]**
*(Arrastra aquí una imagen o GIF)*

---

### ☑️ Checklist del Contribuyente
- [ ] Mi código sigue las guías de estilo de este proyecto.
- [ ] He realizado una auto-revisión de mi propio código.
- [ ] Mis cambios no generan nuevas advertencias (warnings).
- [ ] (Si aplica) He actualizado la documentación correspondiente.

---

### 🔗 Issues Relacionados
<!-- 
Si este Pull Request soluciona algún issue abierto, enlázalo aquí.
Ejemplo: Closes #42
-->

- Closes #[Número del Issue]