# Project Overview

This is a web application for managing and enrolling in university courses and events. It is built as a Single-Page Application (SPA) using a modern frontend stack.

## Main Technologies

*   **Frontend:**
    *   **Framework:** React with Vite
    *   **Language:** TypeScript
    *   **UI Components:** Flowbite React
    *   **Styling:** Tailwind CSS
    *   **Routing:** React Router
    *   **PDF Generation:** jsPDF

*   **Backend:**
    *   **Platform:** Supabase
    *   **Database:** PostgreSQL
    *   **Authentication:** Supabase Auth

## Architecture

The application follows a client-server architecture. The frontend is a React application that communicates with the Supabase backend for data persistence, user authentication, and file storage.

*   **Client-Side:** The React application is responsible for rendering the user interface, managing client-side state, and handling user interactions. It uses React Router for navigation and makes API calls to Supabase to fetch and modify data.
*   **Server-Side (Supabase):** Supabase provides the backend-as-a-service, including a PostgreSQL database, authentication, and storage. The database schema is defined in the `bdd.sql` file.

# Building and Running

## Prerequisites

*   Node.js and npm (or a compatible package manager)
*   A Supabase project set up with the schema from `bdd.sql`
*   A `.env` file with the Supabase URL and anon key.

## Key Commands

*   **Install dependencies:**
    ```bash
    npm install
    ```

*   **Run the development server:**
    ```bash
    npm run dev
    ```
    This will start the Vite development server, typically on `http://localhost:5173`.

*   **Build for production:**
    ```bash
    npm run build
    ```
    This command compiles the TypeScript code and bundles the application for production into the `dist` directory.

*   **Lint the code:**
    ```bash
    npm run lint
    ```
    This runs ESLint to check for code quality and style issues.

# Development Conventions

*   **Component-Based Architecture:** The UI is built using a hierarchy of React components, located in `src/components` and `src/views`.
*   **Styling:** Styling is primarily done using Tailwind CSS utility classes, with some custom styles and themes defined in `src/css` and `src/utils/theme`.
*   **State Management:** Global user state is managed via React Context in `src/contexts/UserContext.tsx`. Local component state is managed with `useState` and `useEffect` hooks.
*   **Routing:** All application routes are defined in `src/routes/Router.tsx`, with components being lazy-loaded for better performance.
*   **Database Interaction:** All communication with the Supabase backend is centralized through the client instance created in `src/utils/supabaseClient.ts`.
*   **Types:** TypeScript types are defined in the `src/types` directory, providing type safety throughout the application.
