import React, { useState, useEffect } from 'react';
import { TextInput, Button, Label, Alert, Textarea, ToggleSwitch, Select, FileInput, Checkbox, Spinner } from 'flowbite-react';
import { supabase } from 'src/utils/supabaseClient';
import { Evento, PerfilSimple, Carrera } from 'src/types/eventos';

interface EditEventFormProps {
  event: Evento;
  onClose: () => void;
  onUpdate: () => void;
}

const EditEventForm: React.FC<EditEventFormProps> = ({ event, onClose, onUpdate }) => {
  const [formData, setFormData] = useState<Partial<Evento>>(event);
  const [docentes, setDocentes] = useState<PerfilSimple[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(event.imagen_url || null);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'failure'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allCareers, setAllCareers] = useState<Carrera[]>([]);
  const [selectedCareers, setSelectedCareers] = useState<number[]>([]);
  const [loadingCareers, setLoadingCareers] = useState(false);

  useEffect(() => {
    const fetchDocentesAndCareers = async () => {
      setLoadingCareers(true);
      const { data: docentesData } = await supabase.from('perfiles').select('id, nombre1, apellido1, cedula');
      if (docentesData) setDocentes(docentesData as PerfilSimple[]);

      const { data: careersData } = await supabase.from('carreras').select('id, nombre');
      if (careersData) setAllCareers(careersData as Carrera[]);
      setLoadingCareers(false);
    };
    fetchDocentesAndCareers();
  }, []);

  useEffect(() => {
    setFormData(event);
    setImagePreview(event.imagen_url || null);
    setSelectedCareers(event.carreras?.map(c => c.id) || []);
  }, [event]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        setUploadMessage({ type: 'failure', text: 'Error: Solo se permiten archivos de imagen.' });
        setImageFile(null);
        e.target.value = '';
        return;
    }
    
    setUploadMessage({ type: 'success', text: `Archivo seleccionado: ${file.name}` });
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
  
    let finalValue: any = value;
    if (type === 'checkbox') {
        finalValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
        finalValue = parseFloat(value);
    } else if (type === 'datetime-local') {
        finalValue = value ? new Date(value).toISOString() : null;
    }
    
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleCareerChange = (careerId: number) => {
    setSelectedCareers(prev =>
      prev.includes(careerId)
        ? prev.filter(id => id !== careerId)
        : [...prev, careerId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
        let finalImageUrl = event.imagen_url;

        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const filePath = `eventos/${event.id}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('eventos')
                .upload(filePath, imageFile);

            if (uploadError) throw new Error(`Error al subir imagen: ${uploadError.message}`);

            const { data: publicURLData } = supabase.storage
                .from('eventos')
                .getPublicUrl(filePath);
            
            finalImageUrl = publicURLData.publicUrl;
        }

        const { carreras, responsable, docente, ...updateData } = formData;

        const { error: updateError } = await supabase
            .from('Eventos')
            .update({ ...updateData, imagen_url: finalImageUrl, updated_at: new Date().toISOString() })
            .eq('id', event.id);

        if (updateError) throw updateError;

        // --- Lógica para guardar carreras ---
        const careersToSave = formData.audiencia === 'estudiantes_carrera' ? selectedCareers : [];
        const { error: rpcError } = await supabase.rpc('assign_event_careers', {
            p_event_id: event.id,
            p_career_ids: careersToSave,
        });

        if (rpcError) throw rpcError;
        
        onUpdate();

    } catch (err: any) {
        setError(`Error al actualizar: ${err.message}`);
    } finally {
        setLoading(false);
    }
  };

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().slice(0, 16);
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {error && <Alert color="failure" className="md:col-span-2">{error}</Alert>}
      
      <div className="md:col-span-2">
        <Label htmlFor="nombre" value="Nombre del Evento/Curso" />
        <TextInput id="nombre" name="nombre" value={formData.nombre || ''} onChange={handleChange} required />
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="descripcion" value="Descripción Detallada" />
        <Textarea id="descripcion" name="descripcion" value={formData.descripcion || ''} onChange={handleChange} rows={4} />
      </div>

       <div className="md:col-span-2">
            <Label htmlFor="file-upload" value="Cambiar Imagen del Evento" />
            <div className="flex items-center gap-4 mt-1">
                {imagePreview && <img src={imagePreview} alt="Vista previa" className="h-16 w-16 object-cover rounded" />}
                <FileInput id="file-upload" accept="image/*" onChange={handleFileChange} className="flex-grow" />
            </div>
            {uploadMessage && <Alert color={uploadMessage.type} className="mt-2">{uploadMessage.text}</Alert>}
        </div>

      <div>
        <Label htmlFor="tipo" value="Tipo de Evento" />
        <Select id="tipo" name="tipo" value={formData.tipo || 'otro'} onChange={handleChange} required>
          <option value="curso">Curso</option>
          <option value="conferencia">Conferencia</option>
          <option value="congreso">Congreso</option>
          <option value="webinar">Webinar</option>
          <option value="socializacion">Socialización</option>
          <option value="otro">Otro</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="estado" value="Estado del Evento" />
        <Select id="estado" name="estado" value={formData.estado || 'borrador'} onChange={handleChange} required>
            <option value="borrador">Borrador (No visible)</option>
            <option value="publicado">Publicado (Visible)</option>
        </Select>
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="audiencia" value="Audiencia del Evento" />
        <Select id="audiencia" name="audiencia" value={formData.audiencia || 'publico_general'} onChange={handleChange} required>
          <option value="publico_general">Público General</option>
          <option value="estudiantes_carrera">Estudiantes por Carrera</option>
        </Select>
      </div>

      {formData.audiencia === 'estudiantes_carrera' && (
        <div className="md:col-span-2 p-4 border rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Carreras Permitidas</h3>
            {loadingCareers ? <Spinner /> : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {allCareers.map(career => (
                  <Label key={career.id} className="flex items-center gap-2 p-2 rounded-lg">
                    <Checkbox
                      id={`career-${career.id}`}
                      checked={selectedCareers.includes(career.id)}
                      onChange={() => handleCareerChange(career.id)}
                    />
                    {career.nombre}
                  </Label>
                ))}
              </div>
            )}
        </div>
      )}

      <div>
        <Label htmlFor="fecha_inicio_evento" value="Inicio del Evento" />
        <TextInput id="fecha_inicio_evento" name="fecha_inicio_evento" type="datetime-local" value={formatDateForInput(formData.fecha_inicio_evento)} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="fecha_fin_evento" value="Fin del Evento" />
        <TextInput id="fecha_fin_evento" name="fecha_fin_evento" type="datetime-local" value={formatDateForInput(formData.fecha_fin_evento)} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="fecha_inicio_inscripcion" value="Inicio de Inscripciones" />
        <TextInput id="fecha_inicio_inscripcion" name="fecha_inicio_inscripcion" type="datetime-local" value={formatDateForInput(formData.fecha_inicio_inscripcion)} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="fecha_fin_inscripcion" value="Cierre de Inscripciones" />
        <TextInput id="fecha_fin_inscripcion" name="fecha_fin_inscripcion" type="datetime-local" value={formatDateForInput(formData.fecha_fin_inscripcion)} onChange={handleChange} />
      </div>

      <div className="flex flex-col gap-4 p-4 border rounded-lg">
        <ToggleSwitch name="es_pagado" label="Es de Pago" checked={formData.es_pagado || false} onChange={(checked) => setFormData(prev => ({...prev, es_pagado: checked, costo: checked ? prev.costo : 0}))} />
        {formData.es_pagado && (
            <div>
                <Label htmlFor="costo" value="Costo ($)" />
                <TextInput id="costo" name="costo" type="number" min="0" step="0.01" value={formData.costo || 0} onChange={handleChange} />
            </div>
        )}
      </div>

      <div className="flex flex-col gap-4 p-4 border rounded-lg">
        <ToggleSwitch name="genera_certificado" label="Genera Certificado" checked={formData.genera_certificado || false} onChange={(checked) => setFormData(prev => ({...prev, genera_certificado: checked}))} />
        <div>
            <Label htmlFor="numero_horas" value="Número de Horas" />
            <TextInput id="numero_horas" name="numero_horas" type="number" min="0" value={formData.numero_horas || 0} onChange={handleChange} />
        </div>
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="docente_id" value="Docente Asignado" />
        <Select id="docente_id" name="docente_id" value={formData.docente_id || ''} onChange={handleChange}>
            <option value="">-- Sin docente --</option>
            {docentes.map(d => (
                <option key={d.id} value={d.id}>{`${d.nombre1} ${d.apellido1} (${d.cedula})`}</option>
            ))}
        </Select>
      </div>

      <div className="md:col-span-2 flex justify-end gap-2 mt-4">
        <Button color="gray" onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button type="submit" isProcessing={loading}>Guardar Cambios</Button>
      </div>
    </form>
  );
};

export default EditEventForm;