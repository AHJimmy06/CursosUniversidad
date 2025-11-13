import React, { useState } from 'react';
import { supabase } from 'src/utils/supabaseClient';
import { useUser } from 'src/contexts/UserContext';
import { Button, FileInput, Spinner, Alert } from 'flowbite-react';
import { HiInformationCircle } from 'react-icons/hi';

const BUCKET_CARRERAS = 'comprobantes-carrera';

const SolicitarAccesoCarrera: React.FC<{ onUploadComplete: () => void }> = ({ onUploadComplete }) => {
  const { user } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Subir el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_CARRERAS)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Obtener la URL pública
      const { data: urlData } = supabase.storage
        .from(BUCKET_CARRERAS)
        .getPublicUrl(filePath);

      if (!urlData) throw new Error('No se pudo obtener la URL del archivo.');
      
      const publicURL = urlData.publicUrl;

      // 3. Actualizar el perfil del usuario
      const { error: updateError } = await supabase
        .from('perfiles')
        .update({
          comprobante_carrera_url: publicURL,
          estado_verificacion: 'pendiente',
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 4. Notificar al componente padre para que refresque el estado
      onUploadComplete();

    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al subir el documento.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border-t mt-6">
      <h3 className="text-xl font-semibold mb-3">Solicitar Verificación de Carrera</h3>
      <p className="text-gray-600 mb-4">
        Sube un documento (ej. certificado de matrícula) para que un administrador pueda verificar y asignarte a tu carrera.
      </p>
      
      {error && (
        <Alert color="failure" icon={HiInformationCircle} className="mb-4">
          {error}
        </Alert>
      )}

      <div className="flex items-center gap-4">
        <FileInput id="file-upload" onChange={handleFileChange} className="flex-grow" />
        <Button onClick={handleUpload} disabled={!file || loading}>
          {loading ? <Spinner size="sm" /> : 'Enviar Documento'}
        </Button>
      </div>
    </div>
  );
};

export default SolicitarAccesoCarrera;
