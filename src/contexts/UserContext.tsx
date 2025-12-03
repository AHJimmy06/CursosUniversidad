import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  nombre1: string;
  apellido1: string;
  rol: 'administrador' | 'general';
  cdc_roles?: string[];
}

interface UserContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isLoggingIn: boolean;
  isDocente: boolean;
  isResponsable: boolean;
  activeRole: string;
  setActiveRole: (role: string) => void;
  setIsLoggingIn: (isLoggingIn: boolean) => void;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  // ESTADO CRÍTICO: Comienza en true, pero una vez que pasa a false, 
  // NUNCA debe volver a true automáticamente por eventos de sesión.
  const [loading, setLoading] = useState(true); 
  
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isDocente, setIsDocente] = useState(false);
  const [isResponsable, setIsResponsable] = useState(false);
  const [activeRole, setActiveRole] = useState<string>('Usuario');

  useEffect(() => {
    if (profile?.rol === 'administrador') {
      setActiveRole('administrador');
    } else {
      setActiveRole('Usuario');
    }
  }, [profile]);

  const fetchFullProfile = useCallback(async (currentUser: User) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('perfiles')
        .select('id, nombre1, apellido1, rol')
        .eq('id', currentUser.id)
        .single();

      if (profileError) {
        // Si no hay perfil, no lanzamos error, solo logueamos.
        // Esto evita crashes si la BD falla momentáneamente.
        console.warn("No se pudo cargar perfil:", profileError.message);
        return;
      }

      if (!profileData) return;

      // NOTA PARA DESARROLLADORES:
      // Si un usuario que debería ser "Miembro CAB" (o tener otro rol de CDC)
      // no puede realizar acciones, es muy probable que el problema esté en la base de datos.
      // Verifique lo siguiente:
      // 1. Que exista una entrada en la tabla `cdc_usuarios_roles` que vincule el `usuario_id` con el `rol_id` correcto.
      // 2. Que el `rol_id` en `cdc_usuarios_roles` corresponda a "Miembro CAB" en la tabla `cdc_roles`.
      const [cdcRolesResponse, docenteResponse, responsableResponse] = await Promise.all([
        supabase.from('cdc_usuarios_roles').select('roles:cdc_roles(nombre_rol)').eq('usuario_id', currentUser.id),
        supabase.from('Eventos').select('id', { count: 'exact', head: true }).eq('docente_id', currentUser.id),
        supabase.from('Eventos').select('id', { count: 'exact', head: true }).eq('responsable_id', currentUser.id)
      ]);

      const cdcRoles = cdcRolesResponse.data?.map(r => (r.roles as any).nombre_rol) || [];
      const allRoles = [profileData.rol, ...cdcRoles];

      setProfile({ ...profileData, cdc_roles: allRoles });
      setIsDocente((docenteResponse.count ?? 0) > 0);
      setIsResponsable((responsableResponse.count ?? 0) > 0);

    } catch (error) {
      console.error("Error en fetchFullProfile:", error);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          // Quitamos el loading inmediatamente (Optimista)
          if (mounted) setLoading(false);
          // Cargamos detalles en segundo plano
          await fetchFullProfile(session.user);
        } else {
          setUser(null);
          if (mounted) setLoading(false);
        }
      } catch (error) {
        console.error("Error init session:", error);
        if (mounted) setLoading(false);
      }
    };

    initializeSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // Eventos de ruido que ignoramos completamente
      if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // AQUÍ ESTÁ EL CAMBIO CLAVE:
        // No importa si es SIGNED_IN, PASSWORD_RECOVERY o cambio de pestaña.
        // NUNCA ponemos setLoading(true). Siempre asumimos que la app ya está lista 
        // y solo actualizamos datos "por debajo".
        fetchFullProfile(currentUser);
        
        // Solo aseguramos que loading sea false por si acaso quedó pegado
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setIsDocente(false);
        setIsResponsable(false);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchFullProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchFullProfile(user);
  }, [user, fetchFullProfile]);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    isLoggingIn,
    isDocente,
    isResponsable,
    activeRole,
    setActiveRole,
    setIsLoggingIn,
    refreshProfile,
  }), [user, profile, loading, isLoggingIn, isDocente, isResponsable, activeRole, refreshProfile]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser debe ser usado dentro de un UserProvider');
  }
  return context;
};