
# 🎓 Sistema de Gestión de Eventos de la FISEI

El **Sistema de Gestión de Eventos de la FISEI** es una aplicación web desarrollada como un proyecto universitario para la gestión de cursos y eventos académicos de la Facultad de Ingeniería en Sistemas, Electrónica e Industrial (FISEI). La plataforma permite la administración de eventos, la inscripción de estudiantes y la gestión de roles de usuario.

## ✨ Funcionalidades Principales

La aplicación cuenta con un sistema de roles dinámico que adapta la interfaz y las funcionalidades según el tipo de usuario:

### Rol: `Administrador`
- **Gestión de Usuarios:** Crear, ver y administrar todos los usuarios del sistema.
- **Gestión de Eventos:** Control total sobre los eventos (crear, editar, eliminar y publicar).
- **Validación de Carreras y Matrículas:** Administrar y validar las carreras disponibles y las inscripciones de los estudiantes.
- **Configuración del Sistema:** Acceso a paneles de configuración de apariencia y otros ajustes generales.

### Rol: `Docente` / `Responsable`
- **Gestión de Eventos Asignados:** Administrar los detalles de los eventos en los que han sido designados como "Docente" o "Responsable".
- **Gestión de Estudiantes:** Ver y gestionar la lista de estudiantes inscritos en sus eventos.

### Rol: `Estudiante` (General)
- **Catálogo de Eventos:** Explorar todos los eventos y cursos disponibles.
- **Inscripción:** Inscribirse en los eventos de su interés.
- **Mis Eventos:** Ver un listado de todos los eventos en los que está inscrito.
- **Gestión de Perfil:** Actualizar su información personal.

## 🚀 Comenzando

Sigue estas instrucciones para obtener una copia del proyecto en funcionamiento en tu máquina local para propósitos de desarrollo y pruebas.

### Pre-requisitos 📋

- **Node.js** (v18 o superior)
- **Git**
- Un editor de código (se recomienda **Visual Studio Code**)

### Instalación 🔧

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/AHJimmy06/CursosUniversidad.git
    ```

2.  **Acceder al directorio del proyecto:**
    ```bash
    cd CursosUniversidad
    ```

3.  **Instalar dependencias:**
    ```bash
    npm install
    ```

4.  **Configurar variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto y añade las siguientes variables. Estas credenciales son necesarias para la conexión con el backend (Supabase) y otras integraciones.

    ```env
    # Credenciales de Supabase
    VITE_SUPABASE_URL=TU_URL_DE_SUPABASE
    VITE_SUPABASE_ANON_KEY=TU_LLAVE_ANON_DE_SUPABASE

    # Credenciales de GitHub (necesarias para la funcionalidad de reportar un error desde la aplicación)
    GITHUB_REPO=TU_REPOSITORIO_GITHUB
    GITHUB_TOKEN=TU_TOKEN_DE_GITHUB
    ```

5.  **Ejecutar el entorno de desarrollo:**
    Una vez configurado, inicia la aplicación en modo local.
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:5173`.

## 🛠️ Construido con

- **React & Vite:** Como base del frontend para una experiencia de desarrollo rápida y moderna.
- **TypeScript:** Para un código más robusto y mantenible.
- **Tailwind CSS:** Para el diseño de la interfaz de usuario.
- **Supabase:** Utilizado como Backend as a Service (BaaS) para la base de datos, autenticación y APIs.
- **Git & GitHub:** Para el control de versiones del código fuente.

## ✒️ Autores

- **Cobos Taco Alison Marcela**
- **Tisalema Carrillo Patricio Sebastian**
- **Añilema Hoffmann Jimmy Alexander**
- **Rojas Hechavarria Maia Carolina**
- **Quitto Navarrete Bryan Lenin**
- **Villalba López Washington Esteban**

## 📄 Licencia

Este proyecto está bajo la **Licencia MIT** - mira el archivo `LICENSE.md` para más detalles.
