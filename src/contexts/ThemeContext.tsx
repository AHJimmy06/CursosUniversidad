// En src/contexts/ThemeContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

// ... (interface ThemeConfig si la necesitas para otras cosas como el logo)

const ThemeContext = createContext<any>(null); // Lo dejamos simple por ahora

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<any>(null);

  useEffect(() => {
    const fetchTheme = async () => {
      const { data } = await supabase
        .from('configuracion_sitio')
        .select('logo_url, contenido_estatico')
        .eq('id', 1)
        .single();
      
      if (data && data.contenido_estatico?.colores) {
        const colors = data.contenido_estatico.colores;
        setTheme(colors); // Guardamos el objeto de colores en el estado

        // --- La Magia: Inyectar las 6 variables CSS globales ---
        document.documentElement.style.setProperty('--color-primary', colors.primario);
        document.documentElement.style.setProperty('--color-secondary', colors.secundario);
        document.documentElement.style.setProperty('--color-primary-emphasis', colors.primary_emphasis);
        document.documentElement.style.setProperty('--color-secondary-emphasis', colors.secondary_emphasis);
        document.documentElement.style.setProperty('--color-lightprimary', colors.lightprimary);
        document.documentElement.style.setProperty('--color-lightsecondary', colors.lightsecondary);
        document.documentElement.style.setProperty('--color-info', colors.info);
        document.documentElement.style.setProperty('--color-lightinfo', colors.lightinfo);
        document.documentElement.style.setProperty('--color-info-emphasis', colors.info_emphasis);
      }
    };
    fetchTheme();
  }, []);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);