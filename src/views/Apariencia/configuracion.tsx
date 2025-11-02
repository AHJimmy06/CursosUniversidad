import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useUser } from '../../contexts/UserContext';
import { Button, Label, TextInput, Alert } from 'flowbite-react';

// Tipos simplificados (solo primario y secundario)
type ColorConfig = {
  primario: string;
  secundario: string;
  primary_emphasis: string;
  secondary_emphasis: string;
  lightprimary: string;
  lightsecondary: string;
};

type SiteConfig = {
  logo_url: string;
  colores: ColorConfig;
};

// Valores por defecto para los colores
const DEFAULT_COLORS: ColorConfig = {
  primario: '#cd1616',
  secundario: '#f8c20a',
  primary_emphasis: '#810d0d',
  secondary_emphasis: '#c77e00',
  lightprimary: '#c61d1d50',
  lightsecondary: '#ffbb004b',
};

const ConfiguracionPage = () => {
  const { profile } = useUser();
  // El estado principal ahora contiene la URL del logo y el objeto de colores
  const [config, setConfig] = useState<SiteConfig>({ logo_url: '', colores: DEFAULT_COLORS });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'failure', text: string} | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('configuracion_sitio')
        .select('logo_url, contenido_estatico')
        .eq('id', 1)
        .single();

      if (data) {
        setConfig({
          logo_url: data.logo_url || '',
          colores: { ...DEFAULT_COLORS, ...data.contenido_estatico?.colores },
        });
      }
      setLoading(false);
    };
    fetchConfig();
  }, []);

  // --- FUNCIÓN ÚNICA PARA MANEJAR TODOS LOS CAMBIOS DE TEXTO ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    
    // Comprobamos si el ID pertenece a un color o a la URL del logo
    if (id in config.colores) {
      // Es un color
      setConfig(prev => ({ ...prev, colores: { ...prev.colores, [id]: value } }));
    } else {
      // Es la URL del logo
      setConfig(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // --- LÓGICA DE GUARDADO SIMPLIFICADA ---
      // Ahora solo actualizamos la URL y el JSON de colores.
      const { error } = await supabase
        .from('configuracion_sitio')
        .update({
          logo_url: config.logo_url, // Guarda la URL del logo
          contenido_estatico: { colores: config.colores } // Guarda los colores
        })
        .eq('id', 1);

      if (error) throw error;

      setMessage({ type: 'success', text: '¡Configuración guardada! La página se recargará.' });
      setTimeout(() => window.location.reload(), 2000);

    } catch (err: any) {
      setMessage({ type: 'failure', text: 'Error al guardar: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (!profile || profile.rol !== 'administrador') {
    return <Alert color="failure">No tienes permiso para acceder a esta página.</Alert>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Configuración del Sitio</h2>
      {message && <Alert color={message.type} className="mb-4">{message.text}</Alert>}
      
      <div className="space-y-6 max-w-2xl">
        {/* --- SECCIÓN DEL LOGO (SOLO URL) --- */}
        <div>
          <Label htmlFor="logo_url" value="URL del Logo" />
          <div className="mt-2 flex items-center gap-6">
            <img 
              src={config.logo_url || 'https://via.placeholder.com/150?text=Logo'} // Muestra el logo actual o un placeholder
              alt="Vista previa del logo" 
              className="h-20 w-20 object-contain rounded-full bg-gray-100"
              onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150?text=Error'; }} // Fallback si la URL es inválida
            />
            <TextInput 
              id="logo_url" 
              value={config.logo_url} 
              onChange={handleChange} 
              placeholder="https://ejemplo.com/logo.png"
              className="flex-1"
            />
          </div>
        </div>
        
        <hr className="my-8"/>

        {/* --- SECCIÓN DE COLORES (SIMPLIFICADA) --- */}
        <h3 className="text-lg font-medium pt-4">Colores del Tema</h3>
        {/* Primario */}
        <div className="grid grid-cols-3 items-center gap-4">
          <Label htmlFor="primario" value="Primario" />
          <TextInput id="primario" type="color" value={config.colores.primario} onChange={handleChange} />
          <TextInput id="primario" type="text" value={config.colores.primario} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="primary_emphasis" value="Primario (Énfasis)" />
            <TextInput id="primary_emphasis" type="color" value={config.colores.primary_emphasis} onChange={handleChange} />
            <TextInput id="primary_emphasis" type="text" value={config.colores.primary_emphasis} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="lightprimary" value="Primario (Claro)" />
            <TextInput id="lightprimary" type="color" value={config.colores.lightprimary} onChange={handleChange} />
            <TextInput id="lightprimary" type="text" value={config.colores.lightprimary} onChange={handleChange} />
        </div>
          
        <hr className="my-6"/>

        {/* Secundario */}
        <div className="grid grid-cols-3 items-center gap-4">
          <Label htmlFor="secundario" value="Secundario" />
          <TextInput id="secundario" type="color" value={config.colores.secundario} onChange={handleChange} />
          <TextInput id="secundario" type="text" value={config.colores.secundario} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="secondary_emphasis" value="Secundario (Énfasis)" />
            <TextInput id="secondary_emphasis" type="color" value={config.colores.secondary_emphasis} onChange={handleChange} />
            <TextInput id="secondary_emphasis" type="text" value={config.colores.secondary_emphasis} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="lightsecondary" value="Secundario (Claro)" />
            <TextInput id="lightsecondary" type="color" value={config.colores.lightsecondary} onChange={handleChange} />
            <TextInput id="lightsecondary" type="text" value={config.colores.lightsecondary} onChange={handleChange} />
        </div>
        
        <div className="pt-4">
          <Button color="primary" onClick={handleSave} isProcessing={saving}>Guardar Cambios</Button>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionPage;