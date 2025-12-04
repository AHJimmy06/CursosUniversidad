import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import { TextInput, ListGroup } from 'flowbite-react'; // Import ListGroup
import debounce from 'lodash.debounce';

type Perfil = {
  id: string;
  cedula: string;
  nombre_completo: string;
};

interface SearchResponsableProps {
  onSelectResponsable: (id: string) => void;
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
    const { data, error } = await supabase
      .from('perfiles')
      .select('id, cedula, nombre1, nombre2, apellido1, apellido2')
      .or(
        `cedula.ilike.%${search}%,` +
        `nombre1.ilike.%${search}%,` +
        `nombre2.ilike.%${search}%,` +
        `apellido1.ilike.%${search}%,` +
        `apellido2.ilike.%${search}%`
      );

    if (error) {
      console.error('Error fetching perfiles:', error);
      setResults([]);
    } else {
      const formattedResults = (data || []).map(perfil => ({
        id: perfil.id,
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
    onSelectResponsable(perfil.id);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <TextInput
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onBlur={() => setTimeout(() => setShowResults(false), 100)}
        placeholder="Buscar por nombre, apellido o cédula..."
        className="form-control form-rounded-xl"
      />
      {showResults && (
        <ListGroup className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto dark:bg-gray-700 dark:border-gray-600">
          {isLoading ? (
            <ListGroup.Item>Buscando...</ListGroup.Item>
          ) : results.length > 0 ? (
            results.map((perfil) => (
              <ListGroup.Item
                key={perfil.id} // Usar perfil.id como key
                onClick={() => handleSelect(perfil)}
                className="cursor-pointer"
              >
                {perfil.nombre_completo} ({perfil.cedula})
              </ListGroup.Item>
            ))
          ) : (
            searchTerm.length >= 3 && <ListGroup.Item>No se encontraron resultados.</ListGroup.Item>
          )}
        </ListGroup>
      )}
    </div>
  );
};

export default SearchResponsable;