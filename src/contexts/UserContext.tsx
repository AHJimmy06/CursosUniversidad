import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabaseClient';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  nombre1: string;
  apellido1: string;
  rol: 'administrador' | 'general';
}

interface UserContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isLoggingIn: boolean;
  setIsLoggingIn: (isLoggingIn: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // 1. Función solo para la carga inicial
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data: profileData, error } = await supabase
          .from('perfiles')
          .select('id, nombre1, apellido1, rol')
          .eq('id', session.user.id)
          .single();
        if (error) {
          console.error('Error fetching profile on initial load:', error);
        } else {
          setProfile(profileData);
        }
      }
      setLoading(false);
    };

    fetchSession();

    // 2. Listener para cambios (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // Actualiza el usuario (será null si es logout)
        setUser(session?.user ?? null);

        if (session?.user) {
          // --- ESTA ES LA CORRECCIÓN ---
          // Si hay sesión (login), busca el perfil con el ID de esa sesión
          setLoading(true); // Opcional: mostrar carga durante el login
          const { data: profileData, error } = await supabase
            .from('perfiles')
            .select('id, nombre1, apellido1, rol')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Error fetching profile on auth change:', error);
            setProfile(null);
          } else {
            setProfile(profileData);
          }
          setLoading(false); // Opcional
        } else {
          // Si no hay sesión (logout), limpia el perfil
          setProfile(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    profile,
    loading,
    isLoggingIn,
    setIsLoggingIn,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// No olvides exportar el hook para usar el contexto
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};