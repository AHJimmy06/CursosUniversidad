import React from 'react';
import { Card, Badge, Button } from 'flowbite-react';
import { Link } from 'react-router-dom';
import { Evento } from '../../../types/eventos';
import { HiOutlinePhotograph } from 'react-icons/hi';

interface EventoCardProps {
  evento: Evento;
  showCalificarButton?: boolean;
  showValidarMatriculasButton?: boolean;
  showEditButton?: boolean;
}

const EventoCard: React.FC<EventoCardProps> = ({ evento, showCalificarButton, showValidarMatriculasButton, showEditButton }) => {
  return (
    <Card className="h-full flex flex-col">
      <div className="aspect-video w-full overflow-hidden rounded-lg">
        {evento.imagen_url ? (
          <img
            src={evento.imagen_url}
            alt={`Imagen de ${evento.nombre}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <HiOutlinePhotograph className="text-gray-400 text-4xl" />
          </div>
        )}
      </div>
      
      <div className="p-4 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <Badge color="lightinfo" size="sm" className="capitalize">
            {evento.tipo?.replace('_', ' ') || 'Evento'}
          </Badge>
          <Badge color={evento.es_pagado ? 'warning' : 'success'}>
            {evento.es_pagado ? `$${evento.costo}` : 'Gratis'}
          </Badge>
        </div>
        <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white flex-grow">
          {evento.nombre}
        </h5>
        <p className="font-normal text-gray-700 dark:text-gray-400 text-sm mb-4 line-clamp-3">
          {evento.descripcion || 'Sin descripción disponible.'}
        </p>
        <div className="mt-auto flex flex-col gap-2">
          <Link to={`/evento/${evento.id}`}>
            <Button color="primary" className="w-full">
              Ver más detalles
            </Button>
          </Link>
          {showCalificarButton && (
            <Link to={`/docente/gestion-estudiantes/${evento.id}`}>
              <Button color="secondary" className="w-full">
                Calificar Estudiantes
              </Button>
            </Link>
          )}
          {showValidarMatriculasButton && (
            <Link to={`/responsable/solicitudes/${evento.id}`}>
              <Button color="secondary" className="w-full">
                Validar Matrículas
              </Button>
            </Link>
          )}
          {showEditButton && (
            <Link to={`/eventos/editar/${evento.id}`}>
              <Button color="warning" className="w-full">
                Editar Evento
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
};

export default EventoCard;