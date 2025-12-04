import React, { useState, useEffect } from 'react';
import { supabase } from 'src/utils/supabaseClient';
import { Table, Spinner, Alert } from 'flowbite-react';

interface AuditLog {
  id: number;
  created_at: string;
  solicitud_id: number;
  accion: string;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  notas: string | null;
  actor: string;
}

const Auditoria: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('cdc_audit_log')
          .select(`
            id,
            created_at,
            solicitud_id,
            accion,
            valor_anterior,
            valor_nuevo,
            notas,
            perfiles ( nombre1, apellido1 )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        const formattedData = data.map((log: any) => ({
          ...log,
          actor: log.perfiles ? `${log.perfiles.nombre1} ${log.perfiles.apellido1}`.trim() : 'Sistema'
        }));

        setLogs(formattedData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="xl" />
        <span className="pl-3">Cargando historial de cambios...</span>
      </div>
    );
  }

  if (error) {
    return <Alert color="failure">Error al cargar los datos de auditoría: {error}</Alert>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Gestión de Cambios y Auditoría</h1>
      {logs.length > 0 ? (
        <Table hoverable>
          <Table.Head>
            <Table.HeadCell>Fecha y Hora</Table.HeadCell>
            <Table.HeadCell>Solicitud ID</Table.HeadCell>
            <Table.HeadCell>Acción</Table.HeadCell>
            <Table.HeadCell>Valor Anterior</Table.HeadCell>
            <Table.HeadCell>Valor Nuevo</Table.HeadCell>
            <Table.HeadCell>Notas</Table.HeadCell>
            <Table.HeadCell>Realizado por</Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {logs.map(log => (
              <Table.Row key={log.id}>
                <Table.Cell>{new Date(log.created_at).toLocaleString()}</Table.Cell>
                <Table.Cell>{log.solicitud_id}</Table.Cell>
                <Table.Cell>{log.accion}</Table.Cell>
                <Table.Cell>{log.valor_anterior}</Table.Cell>
                <Table.Cell>{log.valor_nuevo}</Table.Cell>
                <Table.Cell>{log.notas}</Table.Cell>
                <Table.Cell>{log.actor}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      ) : (
        <div className="text-center py-10">
          <p className="text-lg text-gray-500">No se encontraron registros en el historial de cambios.</p>
        </div>
      )}
    </div>
  );
};

export default Auditoria;
