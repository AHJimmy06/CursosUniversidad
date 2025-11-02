import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabaseClient';

interface AppSettings {
  logo_url: string | null;
  banner_url: string | null;
  primary_color: string;
  secondary_color: string;
}

interface AppContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const defaultSettings: AppSettings = {
  logo_url: null,
  banner_url: null,
  primary_color: '#3b82f6', // Default primary color (blue-500)
  secondary_color: '#10b981', // Default secondary color (emerald-500)
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1) // Asumimos que solo hay un registro de configuración con id=1
        .single();

      if (error) {
        console.error('Error fetching app settings:', error);
      } else if (data) {
        setSettings({
          logo_url: data.logo_url || defaultSettings.logo_url,
          banner_url: data.banner_url || defaultSettings.banner_url,
          primary_color: data.primary_color || defaultSettings.primary_color,
          secondary_color: data.secondary_color || defaultSettings.secondary_color,
        });
      }
    };

    fetchSettings();
  }, []);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      ...newSettings,
    }));
  };

  return (
    <AppContext.Provider value={{ settings, updateSettings }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

const initialState = {
  primaryColor: "#2563eb",
  secondaryColor: "#6b7280"
};