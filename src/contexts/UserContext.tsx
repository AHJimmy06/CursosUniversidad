import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabaseClient';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  nombre1: string;
  apellido1: string;
  rol: 'administrador' | 'general'; // Añadir el campo rol
}

interface UserContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isLoggingIn: boolean;
  isDocente: boolean;
  isResponsable: boolean;
  setIsLoggingIn: (isLoggingIn: boolean) => void;
  refreshProfile?: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isDocente, setIsDocente] = useState(false);
  const [isResponsable, setIsResponsable] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data: profileData } = await supabase
          .from('perfiles')
          .select('id, nombre1, apellido1, rol') // Incluir 'rol' en la selección
          .eq('id', session.user.id)
          .single();
        setProfile(profileData);

        // Determinar si el usuario es docente de al menos un evento
        const { count: docenteCount, error: docenteErr } = await supabase
          .from('Eventos')
          .select('id', { count: 'exact', head: true })
          .eq('docente_id', session.user.id);
        setIsDocente(!docenteErr && (typeof docenteCount === 'number') && docenteCount > 0);

        // Determinar si el usuario es responsable de al menos un evento
        const { count: responsableCount, error: responsableErr } = await supabase
          .from('Eventos')
          .select('id', { count: 'exact', head: true })
          .eq('responsable_id', session.user.id);
        setIsResponsable(!responsableErr && (typeof responsableCount === 'number') && responsableCount > 0);
      }
      setLoading(false);
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setProfile(null);
      } else {
        fetchSession();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    const { data: profileData } = await supabase
      .from('perfiles')
      .select('id, nombre1, apellido1, rol')
      .eq('id', user.id)
      .single();
    setProfile(profileData as Profile | null);
  };

  const value = {
    user,
    profile,
    loading,
    isLoggingIn,
    isDocente,
    isResponsable,
    setIsLoggingIn,
    refreshProfile,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser debe ser usado dentro de un UserProvider');
  }
  return context;
};