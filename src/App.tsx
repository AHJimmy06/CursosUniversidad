// En: src/App.tsx

import { RouterProvider } from "react-router-dom";
import { Flowbite, ThemeModeScript } from 'flowbite-react';
import customTheme from './utils/theme/custom-theme';
import router from "./routes/Router";
import { UserProvider } from "./contexts/UserContext";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './utils/supabaseClient';

// --- CAMBIO 1: Definir una interfaz para nuestro tema ---
// Esto hace el código más seguro y fácil de leer.
interface ThemeConfig {
  logo_url: string;
  colores: any; // Mantenemos los colores flexibles
}

// Creamos el contexto con el tipo correcto
const ThemeContext = createContext<ThemeConfig | null>(null);

// Definimos el Provider (el "Motor del Tema")
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // El estado ahora contendrá el objeto completo del tema
  const [theme, setTheme] = useState<ThemeConfig | null>(null);

  useEffect(() => {
    const fetchAndApplyTheme = async () => {
      const { data } = await supabase
        .from('configuracion_sitio')
        .select('logo_url, contenido_estatico')
        .eq('id', 1)
        .single();
      
      // Añadimos un console.log para ver qué viene de la base de datos
      console.log('Datos de configuración cargados:', data);

      if (data) {
        // --- CAMBIO 2: Guardar el objeto COMPLETO en el estado ---
        const newThemeData: ThemeConfig = {
          logo_url: data.logo_url || '', // Guardamos la URL (o un string vacío si es nula)
          colores: data.contenido_estatico?.colores || {}, // Guardamos los colores
        };
        setTheme(newThemeData); // ¡Ahora guardamos todo!

        // La lógica para aplicar los colores ya era correcta y no cambia
        if (newThemeData.colores) {
          const colors = newThemeData.colores;
          document.documentElement.style.setProperty('--color-primary', colors.primario);
          document.documentElement.style.setProperty('--color-secondary', colors.secundario);
          document.documentElement.style.setProperty('--color-primary-emphasis', colors.primary_emphasis);
          document.documentElement.style.setProperty('--color-secondary-emphasis', colors.secondary_emphasis);
          document.documentElement.style.setProperty('--color-lightprimary', colors.lightprimary);
          document.documentElement.style.setProperty('--color-lightsecondary', colors.lightsecondary);
        }
      }
    };
    fetchAndApplyTheme();
  }, []);

  // Ahora el 'value' que se pasa es el objeto 'theme' completo (con logo y colores)
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook para usar el tema, ahora con el tipo correcto
export const useTheme = (): ThemeConfig | null => useContext(ThemeContext);


function App() {
  return (
    <>
      <ThemeModeScript />
      <Flowbite theme={{ theme: customTheme }}>
        <UserProvider>
          <ThemeProvider>
            <RouterProvider router={router} />
          </ThemeProvider>
        </UserProvider>
      </Flowbite>
    </>
  );
}

export default App;