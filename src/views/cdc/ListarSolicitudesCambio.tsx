import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { SolicitudDeCambio } from '../../types/cdc';
import { useUser } from '../../contexts/UserContext';
import { Badge, Card, Spinner, Alert, TextInput, Select } from 'flowbite-react';

const ListarSolicitudesCambio = () => {
  const [solicitudes, setSolicitudes] = useState<SolicitudDeCambio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useUser();
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  useEffect(() => {
    let isActive = true;

    const fetchSolicitudes = async () => {
      // Si el perfil aún no se ha cargado, no hacemos nada.
      // El useEffect se volverá a ejecutar cuando el 'profile' cambie.
      if (!profile) {
        return;
      }
      
      try {
        if (isActive) {
          setError(null); // Limpiamos cualquier error anterior al reintentar
          setLoading(true);
        }

        const userRoles = profile.cdc_roles || [];
        let query = supabase
          .from('solicitudes_de_cambio')
          .select(`
            id,
            titulo,
            estado,
            prioridad,
            modelo,
            created_at,
            solicitante:solicitante_id(nombre1, apellido1)
          `)
          .not('estado', 'eq', 'borrador'); // Excluir borradores

        const isAdminOrManager = userRoles.includes('administrador') || userRoles.includes('Gestor de Cambios');

        if (!isAdminOrManager) {
          const isLider = userRoles.includes('Líder Técnico');
          const isCabMember = userRoles.includes('Miembro CAB');
          let assignedIds: any[] = [];

          if (isLider) {
            const { data, error } = await supabase
              .from('rfc_desarrolladores_asignados')
              .select('solicitud_id')
              .eq('desarrollador_id', profile.id);
            if (error) throw error;
            assignedIds.push(...data.map(a => a.solicitud_id));
          }

          if (isCabMember) {
            const { data, error } = await supabase
              .from('rfc_cab_miembros')
              .select('solicitud_id')
              .eq('miembro_id', profile.id);
            if (error) throw error;
            assignedIds.push(...data.map(a => a.solicitud_id));
          }
          
          const uniqueIds = [...new Set(assignedIds)];

          if (uniqueIds.length === 0) {
            if (isActive) {
              setSolicitudes([]);
              setLoading(false);
            }
            return;
          }
          query = query.in('id', uniqueIds);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        if (!isActive) return;

        setSolicitudes(data as unknown as SolicitudDeCambio[]);
      } catch (err: any) {
        if (isActive) setError(err.message);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    fetchSolicitudes();

    return () => {
      isActive = false;
    };
  }, [profile]);

  const solicitudesFiltradas = React.useMemo(() => {
    let filtered = solicitudes;

    if (filtroEstado !== 'todos') {
      filtered = filtered.filter(s => s.estado === filtroEstado);
    }

    if (filtroNombre) {
      filtered = filtered.filter(s => s.titulo.toLowerCase().includes(filtroNombre.toLowerCase()));
    }
    
    return filtered;
  }, [solicitudes, filtroNombre, filtroEstado]);


  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'aprobada':
      case 'completada':
        return 'success';
      case 'pendiente_revision':
      case 'pendiente_cab':
        return 'warning';
      case 'rechazada':
      case 'cancelada':
        return 'failure';
      case 'en_progreso':
      case 'pendiente_pir':
        return 'info';
      case 'cerrada':
        return 'gray';
      default:
        return 'dark';
    }
  };

  const getModelBadgeColor = (model: string) => {
    switch (model) {
      case 'estandar':
        return 'success';
      case 'emergencia':
        return 'failure';
      case 'normal':
      default:
        return 'info';
    }
  };


  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'critica':
        return 'failure';
      case 'alta':
        return 'warning';
      case 'media':
        return 'indigo';
      case 'baja':
        return 'gray';
      default:
        return 'dark';
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Solicitudes de Cambio</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <TextInput
          placeholder="Filtrar por nombre..."
          value={filtroNombre}
          onChange={(e) => setFiltroNombre(e.target.value)}
        />
        <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="todos">Todos los Estados</option>
          <option value="pendiente_revision">Pendiente Revisión</option>
          <option value="pendiente_cab">Pendiente CAB</option>
          <option value="aprobada">Aprobada</option>
          <option value="en_progreso">En Progreso</option>
          <option value="completada">Completada</option>
          <option value="pendiente_pir">Pendiente PIR</option>
          <option value="rechazada">Rechazada</option>
          <option value="cancelada">Cancelada</option>
          <option value="cerrada">Cerrada</option>
        </Select>
      </div>

      <div>
        {loading && <div className="flex h-64 items-center justify-center"><Spinner size="xl" /></div>}
        
        {error && <Alert color="failure">Error: {error}</Alert>}
        
        {!loading && !error && (
          <div className="grid grid-cols-1 gap-4">
            {solicitudesFiltradas.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  {solicitudes.length === 0 
                    ? "No hay solicitudes para mostrar." 
                    : "No se encontraron solicitudes que coincidan con los filtros aplicados."
                  }
                </p>
            ) : (
                solicitudesFiltradas.map((solicitud) => (
                <Link to={`/cdc/solicitud/${solicitud.id}`} key={solicitud.id} className="block group">
                    <Card className="hover:shadow-lg transition-shadow duration-300 group-hover:border-blue-500 dark:group-hover:border-blue-400">
                    <div className="flex justify-between items-start">
                        <div className="flex-grow">
                            <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                {solicitud.titulo}
                            </h5>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0 ml-4">
                            <Badge color={getPriorityBadgeColor(solicitud.prioridad)} className="capitalize">
                                {solicitud.prioridad}
                            </Badge>
                            <Badge color={getModelBadgeColor(solicitud.modelo)} className="mt-1 capitalize">
                                {solicitud.modelo}
                            </Badge>
                        </div>
                    </div>
                    <p className="font-normal text-gray-700 dark:text-gray-400 mb-1">
                        Solicitante: {solicitud.solicitante ? `${solicitud.solicitante.nombre1} ${solicitud.solicitante.apellido1}` : 'Sistema (GitHub)'}
                    </p>
                    <p className="font-normal text-gray-700 dark:text-gray-400 mb-2">
                        Creado: {new Date(solicitud.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex justify-between items-center">
                        <Badge color={getStatusBadgeColor(solicitud.estado)} className="capitalize">
                            {solicitud.estado.replace(/_/g, ' ')}
                        </Badge>
                        {(solicitud.estado === 'completada' || solicitud.estado === 'pendiente_pir') && (
                            <Badge color="pink" className="animate-pulse">
                                Realizar PIR
                            </Badge>
                        )}
                    </div>
                    </Card>
                </Link>
                ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListarSolicitudesCambio;