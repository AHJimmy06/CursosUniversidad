import { useUser } from 'src/contexts/UserContext';
import { Select } from 'flowbite-react';
import { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const roleToRouteMap: { [key: string]: string } = {
  'usuario': '/catalogo',
  'estudiante': '/estudiante/mis-eventos',
  'docente': '/docente/eventos',
  'responsable': '/responsable/eventos',
  'administrador': '/',
  'Gestor de Cambios': '/cdc/solicitudes',
  'Miembro CAB': '/cdc/solicitudes',
  'Líder Técnico': '/cdc/solicitudes',
};

const RoleSwitcher = () => {
  const { profile, isDocente, isResponsable, activeRole, setActiveRole } = useUser();
  const navigate = useNavigate();

  const [generalRoles, cdcRoles] = useMemo(() => {
    const genRoles = new Set<string>();
    genRoles.add('usuario');

    if (profile?.rol === 'administrador') {
      genRoles.add('administrador');
    }
    if (isDocente) {
      genRoles.add('docente');
    }
    if (isResponsable) {
      genRoles.add('responsable');
    }
    if (!isDocente && !isResponsable) {
      genRoles.add('estudiante');
    }
    
    const cdc = profile?.cdc_roles?.filter(role => 
      ['Gestor de Cambios', 'Miembro CAB', 'Líder Técnico'].includes(role)
    ) || [];

    return [Array.from(genRoles), cdc];
  }, [profile, isDocente, isResponsable]);
  
  const handleRoleChange = (newRole: string) => {
    setActiveRole(newRole);
    const path = roleToRouteMap[newRole];
    if (path) {
      navigate(path);
    }
  };

  if (!profile) return null;

  const allRoles = [...generalRoles, ...cdcRoles];

  if (allRoles.length <= 1) return null;

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="flex gap-4 items-center">
      <Select
        value={activeRole}
        onChange={(e) => handleRoleChange(e.target.value)}
        sizing="sm"
      >
        <optgroup label="Plataforma">
          {generalRoles.map(role => (
            <option key={role} value={role}>{capitalize(role)}</option>
          ))}
        </optgroup>
        {cdcRoles.length > 0 && (
          <optgroup label="Gestión de Cambios">
            {cdcRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </optgroup>
        )}
      </Select>
    </div>
  );
};

export default RoleSwitcher;
