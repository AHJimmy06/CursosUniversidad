import { useEffect, useState } from 'react';
import { Alert, Spinner } from 'flowbite-react';
import { HiUsers, HiCalendar, HiUserCircle, HiShieldCheck } from 'react-icons/hi';
import { useUser } from 'src/contexts/UserContext';
import { supabase } from 'src/utils/supabaseClient';
import StatCard from 'src/components/dashboard/StatCard';
import Error from 'src/views/auth/error/Error';

interface DashboardStats {
  admins: number;
  general_users: number;
  events: number;
  responsables: number;
}

const Dashboard = () => {
  const { profile, loading: userLoading } = useUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (profile?.rol !== 'administrador') {
        setLoadingStats(false);
        return;
      }
      
      try {
        setLoadingStats(true);
        const { data, error: rpcError } = await supabase.rpc('get_dashboard_stats');
        
        if (rpcError) throw rpcError;
        
        setStats(data);
      } catch (err: any) {
        setError(err.message || 'No se pudieron cargar las estadísticas.');
      }
      finally {
        setLoadingStats(false);
      }
    };

    if (!userLoading) {
      fetchStats();
    }
  }, [userLoading, profile]);

  if (userLoading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="xl" /></div>;
  }

  // Control de Acceso
  if (profile?.rol !== 'administrador') {
    return <Error />;
  }

  if (error) {
    return <Alert color="failure">{error}</Alert>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Panel de Administración</h1>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Administradores"
          value={stats?.admins}
          icon={HiShieldCheck}
          color="#3B82F6"
          loading={loadingStats}
        />
        <StatCard
          title="Usuarios Generales"
          value={stats?.general_users}
          icon={HiUsers}
          color="#10B981"
          loading={loadingStats}
        />
        <StatCard
          title="Eventos Creados"
          value={stats?.events}
          icon={HiCalendar}
          color="#F97316"
          loading={loadingStats}
        />
        <StatCard
          title="Responsables de Eventos"
          value={stats?.responsables}
          icon={HiUserCircle}
          color="#8B5CF6"
          loading={loadingStats}
        />
      </div>

      {/* Aquí podrían ir más componentes del dashboard en el futuro */}
      
    </div>
  );
};

export default Dashboard;
