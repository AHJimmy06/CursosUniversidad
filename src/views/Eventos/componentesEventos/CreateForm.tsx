import { useState } from "react";
import { Label, TextInput, Button, Alert } from "flowbite-react";
import { supabase } from "../../../utils/supabaseClient"; // Importar el cliente de Supabase
import { useUser } from "../../../contexts/UserContext"; // Importa el contexto de usuario
import SearchResponsable from "./SearchResponsable";

const CreateForm = () => {
  const { user } = useUser(); // Obtiene el usuario autenticado
  const [formData, setFormData] = useState({ nombreEvento: "", idResponsableEvento: "" });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // Nuevo estado para el mensaje de éxito

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      [id]: value
    }));
  };

  const handleResponsableSelect = (id: string) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      idResponsableEvento: id // Ahora recibimos y guardamos el id
    }));
  };

const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setError(null);

  if (!user) {
    setError("Debes iniciar sesión para crear un evento.");
    return;
  }

  const nombreEventoLimpio = formData.nombreEvento.trim();
  // Mantenemos la lógica de limpieza
  const idResponsableEventoLimpio = formData.idResponsableEvento.trim();

  if (nombreEventoLimpio.length === 0) {
    setError("El nombre del evento es obligatorio.");
    return;
  }
  
  try {
    const { data, error: supabaseError } = await supabase
      .from('Eventos')
      .insert([
        {
          nombre: nombreEventoLimpio,
          // --- ✨ LA CORRECCIÓN CLAVE ESTÁ AQUÍ ✨ ---
          // Si idResponsableEventoLimpio es un string con contenido, úsalo.
          // Si es un string vacío, conviértelo a 'null'.
          responsable_id: idResponsableEventoLimpio || null,
        },
      ])
      .select(); // Es buena práctica añadir .select() para obtener el registro creado

    if (supabaseError) {
      throw supabaseError;
    }

    setSuccessMessage("Evento creado exitosamente!");
    setFormData({
      nombreEvento: "",
      idResponsableEvento: "",
    });
    setTimeout(() => setSuccessMessage(null), 5000);

  } catch (err: any) {
    console.error("Error al crear el evento:", err.message);
    setError(err.message || "Ocurrió un error al crear el evento.");
  }
};

// ... el resto de tu componente CreateForm

  return (
    <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words">
      <h5 className="card-title">Formulario de Evento</h5>
      <div className="mt-6">
        <form onSubmit={handleSubmit}>
          {error && <Alert color="failure" className="mb-4">{error}</Alert>}
          {successMessage && <Alert color="success" className="mb-4">{successMessage}</Alert>} {/* Muestra el mensaje de éxito */}
          <div className="grid grid-cols-12 gap-30">
            <div className="lg:col-span-6 col-span-12">
              <div className="flex flex-col gap-4">
                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="nombreEvento" value="Nombre del Evento" />
                  </div>
                  <TextInput
                    id="nombreEvento"
                    type="text"
                    placeholder="Nombre del Evento"
                    required
                    className="form-control form-rounded-xl"
                    onChange={handleChange}
                    value={formData.nombreEvento}
                    maxLength={100}
                  />
                </div>
                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="idResponsableEvento" value="ID del Responsable del Evento" />
                  </div>
                  <SearchResponsable onSelectResponsable={handleResponsableSelect} />
                </div>
              </div>
            </div>
            <div className="col-span-12 flex gap-3">
              <Button type="submit" color={'primary'}>Crear Curso</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateForm;