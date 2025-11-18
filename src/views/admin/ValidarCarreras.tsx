import { useEffect, useState } from 'react';
import { supabase } from 'src/utils/supabaseClient';
import { Table, Button, Alert, Spinner } from 'flowbite-react';
import { User } from 'src/types/user';
import { useUser } from 'src/contexts/UserContext';
import AssignCareerModal from 'src/views/admin/AssignCareerModal';

// Extend the User type to include the new fields
type UserForValidation = User & {
  comprobante_carrera_url: string;
  estado_verificacion: 'no_solicitado' | 'pendiente' | 'verificado';
};

const ValidarCarreras = () => {
  const { profile: currentUser, loading: userLoading } = useUser();
  const [users, setUsers] = useState<UserForValidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const fetchPendingUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('estado_verificacion', 'pendiente');

      if (error) throw error;
      setUsers(data as UserForValidation[]);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los usuarios pendientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && currentUser?.rol === 'administrador') {
      fetchPendingUsers();
    }
  }, [userLoading, currentUser]);

  const handleOpenModal = (userId: string) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
  };

  const handleCloseModal = (shouldRefresh: boolean) => {
    setIsModalOpen(false);
    setSelectedUserId(null);
    if (shouldRefresh) {
      fetchPendingUsers();
    }
  };

  if (userLoading || loading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="xl" /></div>;
  }

  if (currentUser?.rol !== 'administrador') {
    return <Alert color="failure">Acceso denegado. Esta página es solo para administradores.</Alert>;
  }

  if (error) {
    return <Alert color="failure">{error}</Alert>;
  }

  return (
    <>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Validar Carreras de Estudiantes</h1>
        {users.length === 0 ? (
          <Alert color="info">No hay usuarios pendientes de validación.</Alert>
        ) : (
          <div className="overflow-x-auto">
            <Table hoverable>
              <Table.Head>
                <Table.HeadCell>Cédula / Pasaporte</Table.HeadCell>
                <Table.HeadCell>Nombre Completo</Table.HeadCell>
                <Table.HeadCell>Correo</Table.HeadCell>
                <Table.HeadCell>Comprobante</Table.HeadCell>
                <Table.HeadCell>Acción</Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {users.map((user) => (
                  <Table.Row key={user.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Table.Cell>{user.cedula}</Table.Cell>
                    <Table.Cell>{`${user.nombre1} ${user.apellido1}`}</Table.Cell>
                    <Table.Cell>{user.email}</Table.Cell>
                    <Table.Cell>
                      <a
                        href={user.comprobante_carrera_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-cyan-600 hover:underline dark:text-cyan-500"
                      >
                        Ver PDF
                      </a>
                    </Table.Cell>
                    <Table.Cell>
                      <Button size="sm" onClick={() => handleOpenModal(user.id)}>
                        Asignar Carrera
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        )}
      </div>
      <AssignCareerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        userId={selectedUserId}
      />
    </>
  );
};

export default ValidarCarreras;
