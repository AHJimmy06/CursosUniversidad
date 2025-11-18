import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useUser } from '../../contexts/UserContext';
import { Button, Label, TextInput, Alert, Modal } from 'flowbite-react';

type ColorConfig = {
  primario: string;
  secundario: string;
  primary_emphasis: string;
  secondary_emphasis: string;
  lightprimary: string;
  lightsecondary: string;
  info: string;
  lightinfo: string;
  info_emphasis: string;
};

type SiteConfig = {
  logo_url: string;
  colores: ColorConfig;
};

const DEFAULT_COLORS: ColorConfig = {
  primario: '#cd1616',
  secundario: '#f8c20a',
  primary_emphasis: '#810d0d',
  secondary_emphasis: '#c77e00',
  lightprimary: '#c61d1d50',
  lightsecondary: '#ffbb004b',
  info: '#3182CE',
  lightinfo: '#BEE3F8',
  info_emphasis: '#2B6CB0',
};

const DEFAULT_LOGO_URL = '/fisei-icono.jpg';

const ConfiguracionPage = () => {
  const { profile } = useUser();
  const [config, setConfig] = useState<SiteConfig>({ logo_url: DEFAULT_LOGO_URL, colores: DEFAULT_COLORS });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'failure', text: string} | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

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
          logo_url: data.logo_url || DEFAULT_LOGO_URL,
          colores: { ...DEFAULT_COLORS, ...data.contenido_estatico?.colores },
        });
      }
      setLoading(false);
    };
    fetchConfig();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    
    if (id in config.colores) {
      setConfig(prev => ({ ...prev, colores: { ...prev.colores, [id]: value } }));
    } else {
      setConfig(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('configuracion_sitio')
        .update({
          logo_url: config.logo_url,
          contenido_estatico: { colores: config.colores }
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

  const confirmReset = async () => {
    setShowResetModal(false);
    setSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('configuracion_sitio')
        .update({
          logo_url: DEFAULT_LOGO_URL,
          contenido_estatico: { colores: DEFAULT_COLORS }
        })
        .eq('id', 1);

      if (error) throw error;

      setConfig({ logo_url: DEFAULT_LOGO_URL, colores: DEFAULT_COLORS });
      setMessage({ type: 'success', text: '¡Configuración reiniciada! La página se recargará.' });
      setTimeout(() => window.location.reload(), 2000);

    } catch (err: any) {
      setMessage({ type: 'failure', text: 'Error al reiniciar: ' + err.message });
    } finally {
      setSaving(false);
    }
  };
  
  const triggerResetModal = () => {
    setShowResetModal(true);
  };
  
  const cancelReset = () => {
    setShowResetModal(false);
  };

  if (loading) return <p>Cargando...</p>;
  if (!profile || profile.rol !== 'administrador') {
    return <Alert color="failure">No tienes permiso para acceder a esta página.</Alert>;
  }

  return (
    <>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Configuración del Sitio</h2>
        {message && <Alert color={message.type} className="mb-4">{message.text}</Alert>}
        
        <div className="space-y-6 max-w-2xl">
          <div>
            <Label htmlFor="logo_url" value="URL del Logo" />
            <div className="mt-2 flex items-center gap-6">
              <img 
                src={config.logo_url || 'https://via.placeholder.com/150?text=Logo'}
                alt="Vista previa del logo" 
                className="h-20 w-20 object-contain rounded-full bg-gray-100"
                onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150?text=Error'; }}
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

          <h3 className="text-lg font-medium pt-4">🎨 Colores del Tema</h3>
          
          <div className="border p-4 rounded-lg">
            <h4 className="text-md font-semibold mb-3">Color Principal</h4>
            <p className="text-sm text-gray-500 mb-4">Usado para botones, enlaces activos y acentos principales.</p>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="primario" value="Básico" />
              <TextInput id="primario" type="color" value={config.colores.primario} onChange={handleChange} />
              <TextInput id="primario" type="text" value={config.colores.primario} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-3 items-center gap-4 mt-2">
                <Label htmlFor="primary_emphasis" value="Énfasis (Hover)" />
                <TextInput id="primary_emphasis" type="color" value={config.colores.primary_emphasis} onChange={handleChange} />
                <TextInput id="primary_emphasis" type="text" value={config.colores.primary_emphasis} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-3 items-center gap-4 mt-2">
                <Label htmlFor="lightprimary" value="Fondo (Claro)" />
                <TextInput id="lightprimary" type="color" value={config.colores.lightprimary} onChange={handleChange} />
                <TextInput id="lightprimary" type="text" value={config.colores.lightprimary} onChange={handleChange} />
            </div>
            <div className="mt-4 p-4 border rounded-lg flex items-center gap-4" style={{ backgroundColor: config.colores.lightprimary }}>
              <Button style={{ backgroundColor: config.colores.primario, color: '#FFFFFF', borderColor: config.colores.primary_emphasis }}>
                Botón Principal
              </Button>
              <span style={{ color: config.colores.primary_emphasis, fontWeight: 'bold' }}>Texto de Acento</span>
            </div>
          </div>
          
          <div className="border p-4 rounded-lg">
            <h4 className="text-md font-semibold mb-3">Color Secundario</h4>
            <p className="text-sm text-gray-500 mb-4">Usado para notificaciones, insignias o acentos secundarios.</p>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="secundario" value="Básico" />
              <TextInput id="secundario" type="color" value={config.colores.secundario} onChange={handleChange} />
              <TextInput id="secundario" type="text" value={config.colores.secundario} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-3 items-center gap-4 mt-2">
                <Label htmlFor="secondary_emphasis" value="Énfasis (Hover)" />
                <TextInput id="secondary_emphasis" type="color" value={config.colores.secondary_emphasis} onChange={handleChange} />
                <TextInput id="secondary_emphasis" type="text" value={config.colores.secondary_emphasis} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-3 items-center gap-4 mt-2">
                <Label htmlFor="lightsecondary" value="Fondo (Claro)" />
                <TextInput id="lightsecondary" type="color" value={config.colores.lightsecondary} onChange={handleChange} />
                <TextInput id="lightsecondary" type="text" value={config.colores.lightsecondary} onChange={handleChange} />
            </div>
            <div className="mt-4 p-4 border rounded-lg flex items-center gap-4" style={{ backgroundColor: config.colores.lightsecondary }}>
              <span style={{ backgroundColor: config.colores.secundario, color: '#000000', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                Insignia
              </span>
              <span style={{ color: config.colores.secondary_emphasis, fontWeight: 'bold' }}>Texto Secundario</span>
            </div>
          </div>

          <div className="border p-4 rounded-lg">
            <h4 className="text-md font-semibold mb-3">Color de Información</h4>
            <p className="text-sm text-gray-500 mb-4">Usado para alertas informativas, banners y mensajes.</p>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="info" value="Básico" />
              <TextInput id="info" type="color" value={config.colores.info} onChange={handleChange} />
              <TextInput id="info" type="text" value={config.colores.info} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-3 items-center gap-4 mt-2">
                <Label htmlFor="info_emphasis" value="Énfasis (Texto)" />
                <TextInput id="info_emphasis" type="color" value={config.colores.info_emphasis} onChange={handleChange} />
                <TextInput id="info_emphasis" type="text" value={config.colores.info_emphasis} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-3 items-center gap-4 mt-2">
                <Label htmlFor="lightinfo" value="Fondo (Claro)" />
                <TextInput id="lightinfo" type="color" value={config.colores.lightinfo} onChange={handleChange} />
                <TextInput id="lightinfo" type="text" value={config.colores.lightinfo} onChange={handleChange} />
            </div>
            <div className="mt-4 p-4 border rounded-lg" style={{ backgroundColor: config.colores.lightinfo, borderColor: config.colores.info }}>
              <span style={{ color: config.colores.info_emphasis, fontWeight: 'bold' }}>
                Este es un mensaje de información de ejemplo.
              </span>
            </div>
          </div>

          <div className="pt-4 flex justify-between">
            <Button color="blue" onClick={handleSave} isProcessing={saving}>
              Guardar Cambios
            </Button>
            <Button color="failure" onClick={triggerResetModal} isProcessing={saving}>
              Reiniciar Configuración
            </Button>
          </div>
        </div>
      </div>

      <Modal show={showResetModal} onClose={cancelReset}>
        <Modal.Header>Confirmar Reinicio</Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              ¿Estás seguro de que quieres reiniciar toda la configuración a los valores por defecto?
            </h3>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-center gap-4">
          <Button color="failure" onClick={confirmReset} isProcessing={saving}>
            Sí, reiniciar
          </Button>
          <Button color="gray" onClick={cancelReset} disabled={saving}>
            Cancelar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ConfiguracionPage;