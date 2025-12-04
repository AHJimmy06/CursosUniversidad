import { useState } from "react";
import { Label, TextInput, Button, Alert } from "flowbite-react";
import { supabase } from "../../../utils/supabaseClient";
import { useUser } from "../../../contexts/UserContext";
import SearchResponsable from "./SearchResponsable";

const CreateForm = () => {
  const { user } = useUser();
  const [formData, setFormData] = useState({ 
    nombreEvento: "", 
    idResponsableEvento: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      idResponsableEvento: id
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
            responsable_id: idResponsableEventoLimpio || null,
          },
        ])
        .select();

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

  return (
    <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words">
      <h5 className="card-title">Formulario de Evento</h5>
      <div className="mt-6">
        <form onSubmit={handleSubmit}>
          {error && <Alert color="failure" className="mb-4">{error}</Alert>}
          {successMessage && <Alert color="success" className="mb-4">{successMessage}</Alert>}
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
                    <Label htmlFor="idResponsableEvento" value="Responsable del Evento" />
                  </div>
                  <SearchResponsable onSelectResponsable={handleResponsableSelect} />
                </div>
              </div>
            </div>
            <div className="col-span-12 flex gap-3">
              <Button type="submit" color={'primary'}>Crear Evento</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateForm;