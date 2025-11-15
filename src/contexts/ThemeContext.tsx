import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

type ColorConfig = {
  primario: string;
  secundario: string;
  primary_emphasis: string;
  secondary_emphasis: string;
  lightprimary: string;
  lightsecondary: string;
  info: string;
  lightinfo: string;
  info_emphasis: string;
};

type SiteConfig = {
  logo_url: string;
  colores: ColorConfig;
};

const DEFAULT_COLORS: ColorConfig = {
  primario: '#cd1616',
  secundario: '#f8c20a',
  primary_emphasis: '#810d0d',
  secondary_emphasis: '#c77e00',
  lightprimary: '#c61d1d50',
  lightsecondary: '#ffbb004b',
  info: '#3182CE',
  lightinfo: '#BEE3F8',
  info_emphasis: '#2B6CB0',
};

const DEFAULT_CONFIG: SiteConfig = {
  logo_url: '/fisei-icono.jpg',
  colores: DEFAULT_COLORS,
};

interface ThemeContextType {
  config: SiteConfig;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  config: DEFAULT_CONFIG,
  isLoading: true,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('configuracion_sitio')
        .select('logo_url, contenido_estatico')
        .eq('id', 1)
        .single();

      if (data) {
        setConfig({
          logo_url: data.logo_url || DEFAULT_CONFIG.logo_url,
          colores: { ...DEFAULT_COLORS, ...data.contenido_estatico?.colores },
        });
      } else {
        setConfig(DEFAULT_CONFIG);
      }
      setIsLoading(false);
    };

    fetchConfig();
  }, []);

  return (
    <ThemeContext.Provider value={{ config, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeConfig = () => useContext(ThemeContext);