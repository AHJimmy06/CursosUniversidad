import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import { TextInput } from 'flowbite-react';
import debounce from 'lodash.debounce';

type Perfil = {
  id: string; // Añadir el campo id
  cedula: string;
  nombre_completo: string;
};

interface SearchResponsableProps {
  onSelectResponsable: (id: string) => void; // Cambiar el tipo de cedula a id
}

const SearchResponsable: React.FC<SearchResponsableProps> = ({ onSelectResponsable }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Perfil[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const fetchPerfiles = async (search: string) => {
    if (search.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    // Consulta directa a la tabla perfiles
    const { data, error } = await supabase
      .from('perfiles')
      .select('id, cedula, nombre1, nombre2, apellido1, apellido2') // Seleccionar también el id
      .or(
        `nombre1.ilike.%${search}%,` +
        `nombre2.ilike.%${search}%,` +
        `apellido1.ilike.%${search}%,` +
        `apellido2.ilike.%${search}%`
      );

    if (error) {
      console.error('Error fetching perfiles:', error);
      setResults([]);
    } else {
      // Combina los nombres y apellidos para mostrar el nombre completo
      const formattedResults = (data || []).map(perfil => ({
        id: perfil.id, // Mapear el id
        cedula: perfil.cedula,
        nombre_completo: [
          perfil.nombre1,
          perfil.nombre2,
          perfil.apellido1,
          perfil.apellido2
        ].filter(part => part).join(' ')
      }));
      setResults(formattedResults);
    }
    setIsLoading(false);
    setShowResults(true);
  };

  const debouncedFetch = useCallback(debounce(fetchPerfiles, 300), []);

  useEffect(() => {
    debouncedFetch(searchTerm);
  }, [searchTerm, debouncedFetch]);

  const handleSelect = (perfil: Perfil) => {
    setSearchTerm(perfil.nombre_completo);
    onSelectResponsable(perfil.id); // Pasar el id en lugar de la cedula
    setShowResults(false);
  };

  return (
    <div className="relative">
      <TextInput
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onBlur={() => setTimeout(() => setShowResults(false), 100)} // Hide on blur with a delay
        placeholder="Buscar por nombre o apellido..."
        className="form-control form-rounded-xl"
      />
      {showResults && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto">
          {isLoading ? (
            <li className="p-2">Buscando...</li>
          ) : results.length > 0 ? (
            results.map((perfil) => (
              <li
                key={perfil.cedula}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onMouseDown={() => handleSelect(perfil)} // Use onMouseDown to fire before onBlur
              >
                {perfil.nombre_completo} ({perfil.cedula})
              </li>
            ))
          ) : (
            searchTerm.length >= 3 && <li className="p-2">No se encontraron resultados.</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchResponsable;