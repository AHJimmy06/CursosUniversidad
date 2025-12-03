**Título del Pull Request:**
style: Mejora la consistencia visual y la experiencia de usuario en vistas clave

---

### 📝 Descripción General

Este Pull Request se enfoca en mejorar la cohesión visual y la experiencia de usuario (UX) a lo largo de varias vistas de la aplicación. Se han estandarizado los componentes de filtrado, se ha homogeneizado el layout de las páginas para eliminar inconsistencias en los fondos y se han añadido micro-interacciones para mejorar la retroalimentación visual al usuario, siguiendo los patrones de diseño ya establecidos en otras secciones de la plataforma.

---

### 📜 Resumen de Cambios

#### ✨ Funcionalidad Principal
- **Filtros de Búsqueda Estandarizados:** Se refactorizaron los controles de filtro en las vistas de `Gestión de Usuarios` y `Lista de Eventos` para utilizar componentes de `flowbite-react` (`Card`, `Label`, `TextInput`, `Select`). Esto unifica la apariencia y el comportamiento de los filtros en toda la aplicación.
- **Consistencia en el Layout de Vistas:** Se eliminaron los contenedores con padding (`CardBox` y `div` con clase `p-6` o `p-4`) de las vistas `Gestión de Usuarios`, `Lista de Eventos` y `Mis Eventos (Estudiante)` para que adopten el color de fondo del layout principal, logrando una apariencia más homogénea y eliminando bordes innecesarios.
- **Efecto Hover en Tarjetas de Eventos:** Se añadió un efecto de sombra (`hover:shadow-lg`) a las tarjetas de los cursos en el `Catálogo` y `Mis Eventos`, replicando el estilo interactivo presente en la sección de "Solicitudes de Cambio" y proporcionando una mejor retroalimentación visual al usuario.

#### 🔧 Mejoras Técnicas y Arquitectura
- **Corrección de Errores de Compilación:** Se solucionaron errores de sintaxis y de tipos en varios componentes (`ListEvents`, `UserManagement`, `AuthRegister`, `DetalleSolicitudCambio`) que surgieron durante la refactorización, asegurando que la aplicación compile y funcione correctamente.
- **Actualización de `.gitignore`:** Se añadieron las extensiones `*.sql` y `*.txt` al archivo `.gitignore` para evitar que archivos de base de datos y de texto temporales sean rastreados por el control de versiones.

---

### ✅ ¿Cómo se ha probado esto?

1. Navega a la ruta `/usuarios/listar`.
2. Verifica que la sección de filtros ahora aparece dentro de una tarjeta (`Card`) y utiliza los componentes de Flowbite.
3. Navega a la ruta `/eventos/listar`.
4. Verifica que la sección de filtros tiene la misma apariencia que en la gestión de usuarios.
5. Navega al `Catálogo de Cursos` (`/catalogo`).
6. Pasa el cursor sobre las tarjetas de los eventos y verifica que aparece un efecto de sombra.
7. Inicia sesión como `estudiante` y navega a `Mis Eventos`.
8. Verifica que la vista ya no tiene un padding extra y que el fondo es consistente con el resto de la aplicación.
9. Confirma que la aplicación compila sin errores ejecutando `npm run build`.

---

### ☑️ Checklist del Contribuyente
- [X] Mi código sigue las guías de estilo de este proyecto.
- [X] He realizado una auto-revisión de mi propio código.
- [X] Mis cambios no generan nuevas advertencias (warnings).
- [X] (Si aplica) He actualizado la documentación correspondiente.

---

### 🔗 Issues Relacionados
- Closes #37

---

### Lista de Tareas
- [x] Mejorar la experiencia de usuario (UX) e interfaz (UI) general .
- [ ] Realizar un barrido completo para corregir redacción y ortografía en toda la aplicación .
- [ ] Implementar validaciones estrictas en formularios de ingreso (Registro, Teléfono, Correo, Cédula) .
- [ ] Programar lógica en campo Email: Si es `@uta.edu.ec` mostrar campo "Carrera", caso contrario ocultarlo .