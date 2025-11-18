import React from 'react';
import { Select, Label, ToggleSwitch } from 'flowbite-react';
import { Carrera } from '../../../types/eventos';

interface FiltrosProps {
  carreras: Carrera[];
  filtros: {
    tipo: string;
    carreraId: string;
    esPagado: string;
  };
  onFiltroChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
  onPagadoChange: (checked: boolean) => void;
}

const FiltrosCatalogo: React.FC<FiltrosProps> = ({ carreras, filtros, onFiltroChange, onPagadoChange }) => {
  return (
    <div className="p-4 mb-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <Label htmlFor="tipo" value="Tipo de Evento" />
          <Select id="tipo" name="tipo" value={filtros.tipo} onChange={onFiltroChange}>
            <option value="">Todos</option>
            <option value="curso">Curso</option>
            <option value="conferencia">Conferencia</option>
            <option value="congreso">Congreso</option>
            <option value="webinar">Webinar</option>
            <option value="socializacion">Socialización</option>
            <option value="otro">Otro</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="carreraId" value="Carrera" />
          <Select id="carreraId" name="carreraId" value={filtros.carreraId} onChange={onFiltroChange}>
            <option value="">Todas</option>
            {carreras.map((carrera) => (
              <option key={carrera.id} value={carrera.id.toString()}>
                {carrera.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <ToggleSwitch
            checked={filtros.esPagado === 'pago'}
            label={filtros.esPagado === 'pago' ? 'Solo de Pago' : 'Mostrar Todos (Gratis/Pago)'}
            onChange={onPagadoChange}
          />
        </div>
      </div>
    </div>
  );
};

export default FiltrosCatalogo;