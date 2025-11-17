# Guía de Contribución - CursosUniversidad

¡Gracias por tu interés en contribuir a **CursosUniversidad**! Este proyecto es una aplicación web para la gestión de cursos universitarios, construida con React, TypeScript, Vite, Tailwind CSS y Supabase. Apreciamos cualquier contribución que ayude a mejorar la plataforma.

## 📋 Tabla de Contenidos
- [Código de Conducta]
- [Cómo Contribuir]
- [Configuración del Entorno de Desarrollo]
- [Guías de Desarrollo]
- [Proceso de Pull Request]
- [Reportar Problemas]
- [Licencia]

## 🤝 Código de Conducta
Este proyecto sigue un código de conducta para fomentar un entorno colaborativo y respetuoso. Al participar, aceptas:
- Ser respetuoso con todos los colaboradores.
- Mantener un lenguaje inclusivo y profesional.
- Evitar cualquier forma de acoso o discriminación.

## 🚀 Cómo Contribuir
Hay varias formas de contribuir:
- **Reportar bugs**: Usa las plantillas de issues en GitHub.
- **Solicitar funcionalidades**: Crea un FSC (Formulario de Solicitud de Cambio) usando las plantillas disponibles.
- **Contribuir código**: Envía un pull request siguiendo las guías a continuación.
- **Mejorar documentación**: Actualiza README, docs o esta guía.

### Tipos de Contribuciones
- **FSC-Usuario Final**: Para usuarios finales o diseñadores (cambios funcionales o de UI/UX), se lo puede realizar desde Reportar un error, una vez ingresado en la aplicación.
- **FSC-Experto**: Para desarrolladores y equipo técnico (cambios técnicos, bugs, mejoras de arquitectura).

## 🛠️ Configuración del Entorno de Desarrollo
1. **Clona el repositorio**:
   git clone https://github.com/tu-usuario/cursosuniversidad.git
   cd cursosuniversidad

2. **Instala dependencias**:
   npm install

3. **Configura variables de entorno**:
   Crea un archivo `.env.local` con las variables necesarias (consulta `.env` para ejemplos). Incluye claves de Supabase, buckets de storage, etc.

4. **Ejecuta el proyecto**:
   npm run dev

5. **Construye para producción**:
   npm run build

### Requisitos Técnicos
- Node.js >= 18
- npm o yarn
- Conocimientos básicos de React, TypeScript y Supabase.

## 📝 Guías de Desarrollo
### Convenciones de Código
- Usa TypeScript para todo el código nuevo.
- Sigue ESLint y Prettier (configurados en el proyecto).
- Nombres de archivos y componentes en PascalCase.
- Funciones y variables en camelCase.
- Usa hooks de React y evita clases.

### Estructura del Proyecto
- `src/components/`: Componentes reutilizables.
- `src/views/`: Páginas y vistas principales.
- `src/contexts/`: Contextos de React (User, Theme).
- `src/utils/`: Utilidades (Supabase client, theme).
- `src/types/`: Definiciones de tipos TypeScript.
- `docs/`: Documentación adicional.

### Manejo de Estado y Datos
- Usa Supabase para backend y base de datos.
- Implementa RLS (Row Level Security) en las tablas.
- Para storage privado, usa signed URLs (consulta `docs/storage-payments.md`).

### Pruebas
- Actualmente no hay suite de pruebas configurada. Contribuciones para agregar Jest o Vitest son bienvenidas.

### Commits
Sigue la convención de commits:
- `feat:` Para nuevas funcionalidades.
- `fix:` Para correcciones de bugs.
- `style:` Para cambios de estilo/UI.
- `docs:` Para actualizaciones de documentación.
- `refactor:` Para refactorizaciones.

Ejemplo: `feat: Implementa CRUD de Eventos y control de acceso por rol`

## 🔄 Proceso de Pull Request
1. **Crea una rama**: Desde `main`, crea una rama descriptiva (ej: `feature/nueva-funcionalidad`).
2. **Desarrolla**: Implementa tus cambios siguiendo las guías.
3. **Prueba**: Asegúrate de que funcione localmente y no rompa nada.
4. **Commit**: Usa mensajes claros y convencionales.
5. **Push**: Sube tu rama a GitHub.
6. **Pull Request**: Crea un PR usando la plantilla en `.github/PULL_REQUEST_TEMPLATE.md`.
   - Describe claramente los cambios.
   - Incluye capturas de pantalla si aplica.
   - Referencia issues relacionados.
7. **Revisión**: Espera feedback y realiza ajustes si es necesario.
8. **Merge**: Una vez aprobado, se mergeará a `main`.

### Checklist del PR
- [ ] Código sigue guías de estilo.
- [ ] Auto-revisión completada.
- [ ] No genera nuevos warnings.
- [ ] Documentación actualizada si aplica.
- [ ] Funcionalidad probada manualmente.

## 🐛 Reportar Problemas
- Usa las plantillas de issues en `.github/ISSUE_TEMPLATE/`.
- Para bugs: Proporciona pasos para reproducir, entorno y logs.
- Para FSC: Completa la sección correspondiente (Usuario Final o Experto).

## 📄 Licencia
Este proyecto está bajo la licencia MIT. Consulta el archivo LICENSE para más detalles.

---

¡Gracias por contribuir a CursosUniversidad! Tu ayuda es invaluable para mejorar la plataforma educativa. Si tienes dudas, abre un issue o contacta al equipo.
