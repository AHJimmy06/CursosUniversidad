import { UserProfile } from '../../../types/user';
import { Button, Table } from 'flowbite-react';
import { IconEdit, IconTrash, IconPlayerPlay } from '@tabler/icons-react';

interface ListUserProps {
  users: UserProfile[];
  loading: boolean;
  onEdit: (user: UserProfile) => void;
  onDelete: (userId: string) => void;
  onReactivate: (userId: string) => void;
}

const ListUser = ({ users, loading, onEdit, onDelete, onReactivate }: ListUserProps) => {
  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <Table.Head>
          <Table.HeadCell>Nombre</Table.HeadCell>
          <Table.HeadCell>Cédula</Table.HeadCell>
          <Table.HeadCell>Email</Table.HeadCell>
          <Table.HeadCell>Rol</Table.HeadCell>
          <Table.HeadCell>Estado</Table.HeadCell>
          <Table.HeadCell>Acciones</Table.HeadCell>
        </Table.Head>
        <Table.Body>
          {users.map((user) => {
            const isInactive = !user.is_active;
            return (
              <Table.Row key={user.id}>
                <Table.Cell>
                  {user.nombre1} {user.nombre2} {user.apellido1} {user.apellido2}
                </Table.Cell>
                <Table.Cell>{user.cedula}</Table.Cell>
                <Table.Cell>{user.email}</Table.Cell>
                <Table.Cell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.rol === 'administrador'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.rol}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    isInactive
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {isInactive ? 'Inactivo' : 'Activo'}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex space-x-2">
                    <Button size="sm" color="gray" onClick={() => onEdit(user)}>
                      <IconEdit size={16} />
                    </Button>
                    {isInactive ? (
                      <Button size="sm" color="success" onClick={() => onReactivate(user.id)}>
                        <IconPlayerPlay size={16} />
                      </Button>
                    ) : (
                      <Button size="sm" color="failure" onClick={() => onDelete(user.id)}>
                        <IconTrash size={16} />
                      </Button>
                    )}
                  </div>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </div>
  );
};

export default ListUser;
