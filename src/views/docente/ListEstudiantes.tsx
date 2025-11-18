import { Estudiante } from '../../types/docente';
import { Table, TextInput } from 'flowbite-react';

interface ListEstudiantesProps {
  estudiantes: Estudiante[];
  loading: boolean;
  onNotaChange: (id: string, nota: string) => void;
  onAsistenciaChange: (id: string, asistencia: string) => void;
}

const ListEstudiantes = ({ estudiantes, loading, onNotaChange, onAsistenciaChange }: ListEstudiantesProps) => {
  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <Table.Head>
          <Table.HeadCell>Nombre</Table.HeadCell>
          <Table.HeadCell>Email</Table.HeadCell>
          <Table.HeadCell>Nota Final</Table.HeadCell>
          <Table.HeadCell>Asistencia (%)</Table.HeadCell>
        </Table.Head>
        <Table.Body>
          {estudiantes.map((estudiante) => (
            <Table.Row key={estudiante.id}>
              <Table.Cell>{estudiante.nombre}</Table.Cell>
              <Table.Cell>{estudiante.email}</Table.Cell>
              <Table.Cell>
                <TextInput
                  type="number"
                  value={estudiante.notaFinal || ''}
                  onChange={(e) => onNotaChange(estudiante.id, e.target.value)}
                />
              </Table.Cell>
              <Table.Cell>
                <TextInput
                  type="number"
                  value={estudiante.asistencia || ''}
                  onChange={(e) => onAsistenciaChange(estudiante.id, e.target.value)}
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};

export default ListEstudiantes;