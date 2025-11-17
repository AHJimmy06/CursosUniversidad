import { useState, useEffect } from 'react';
import { useUser } from 'src/contexts/UserContext';
import { supabase } from 'src/utils/supabaseClient';

const initialState = {
  titulo: '',
  solicitadoPor: '',
  telefono: '',
  descripcionCambio: '',
  motivoCambio: '',
  tipoCambio: 'Nuevo Requerimiento',
  prioridad: '3 - Baja',
};

const ErrorReport = () => {
  const { user, profile } = useUser();
  const [formData, setFormData] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData((prevData) => ({
        ...prevData,
        solicitadoPor: `${profile.nombre1} ${profile.apellido1}`,
      }));
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const reportData = {
      ...formData,
      email: user?.email,
    };

    try {
      const { data, error } = await supabase.functions.invoke('create-github-issue', {
        body: reportData,
      });

      if (error) {
        throw new Error(error.message);
      }
      
      if (data.error) {
        throw new Error(data.error);
      }

      setMessage({ type: 'success', text: '¡Reporte enviado con éxito! Gracias por tu ayuda.' });
      setFormData({
        ...initialState,
        solicitadoPor: formData.solicitadoPor,
      });

    } catch (error: any) {
      console.error('Error al enviar el reporte:', error);
      setMessage({ type: 'error', text: 'Hubo un problema al enviar el reporte. Por favor, inténtalo de nuevo más tarde.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white dark:bg-dark p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Reportar un Error o Solicitar un Cambio</h1>
        <div className="mb-4">
          <p><strong>Proyecto:</strong> CursosUniversidad</p>
          <p className="text-sm text-gray-500">* La Fecha de Solicitud se registra automáticamente al enviar.</p>
        </div>
        <hr className="my-6" />
        <h2 className="text-xl font-semibold mb-4">Sección 1: Información General y Justificación</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="mb-4">
              <label htmlFor="solicitadoPor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Solicitado por: </label>
              <input
                type="text"
                id="solicitadoPor"
                className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="Cargando..."
                value={formData.solicitadoPor}
                onChange={handleChange}
                required
                readOnly
              />
            </div>

            <div className="mb-4">
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Teléfono (Opcional)</label>
              <input
                type="tel"
                id="telefono"
                className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                value={formData.telefono}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* */}
          <div className="mb-4">
            <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Título del Reporte</label>
            <input
              type="text"
              id="titulo"
              className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              placeholder="Ej: El botón de 'Enviar' no funciona"
              value={formData.titulo}
              onChange={handleChange}
              required
            />
          </div>
          {/* */}

          <div className="mb-4">
            <label htmlFor="descripcionCambio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descripción Detallada del Cambio</label>
            <textarea
              id="descripcionCambio"
              rows={4}
              className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              value={formData.descripcionCambio}
              onChange={handleChange}
              required
            ></textarea>
          </div>
          <div className="mb-4">
            <label htmlFor="motivoCambio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Motivo y Justificación del Cambio</label>
            <textarea
              id="motivoCambio"
              rows={4}
              className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              value={formData.motivoCambio}
              onChange={handleChange}
              required
            ></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="mb-4">
              <label htmlFor="tipoCambio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Naturaleza de Cambio</label>
              <select
                id="tipoCambio"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={formData.tipoCambio}
                onChange={handleChange}
                required
              >
                <option>Nuevo Requerimiento</option>
                <option>Sugerencia de mejora</option>
                <option>Defecto/Error</option>
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="prioridad" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prioridad Solicitada</label>
              <select
                id="prioridad"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={formData.prioridad}
                onChange={handleChange}
                required
              >
                <option>3 - Baja</option>
                <option>2 - Media</option>
                <option>1 - Alta</option>
              </select>
            </div>
          </div>
          
          {message && (
            <div 
              className={`p-4 my-4 text-sm rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' 
                  : 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-1col-100'
              }`}
              role="alert"
            >
              {message.text}
            </div>
          )}
          
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Enviando...' : 'Enviar Reporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ErrorReport;