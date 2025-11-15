import { useState, useEffect, useCallback } from 'react';
import { Button, Label, TextInput, Alert, Badge, Spinner } from 'flowbite-react';
import { useNavigate } from 'react-router';
import { supabase } from 'src/utils/supabaseClient';
import { useUser } from 'src/contexts/UserContext';
import { useModal } from 'src/contexts/ModalContext';
import UserAvatar from 'src/components/shared/UserAvatar';
import { Carrera } from 'src/types/eventos';
import SolicitarAccesoCarrera from './SolicitarAccesoCarrera';

const MiPerfil = () => {
    const navigate = useNavigate();
    const { user, profile, loading: userLoading, refreshProfile } = useUser();
    const { showModal } = useModal();
    
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    
    const [profileData, setProfileData] = useState({
        nombre1: '',
        nombre2: '',
        apellido1: '',
        apellido2: '',
        telefono: '',
        fecha_nacimiento: '',
        estado_verificacion: 'no_solicitado',
    });
    const [myCareers, setMyCareers] = useState<Carrera[]>([]);
    const [loadingCareers, setLoadingCareers] = useState(true);

    const fetchFullProfile = useCallback(async () => {
        if (!profile) return;
        setLoadingCareers(true);
        const profilePromise = supabase
            .from('perfiles')
            .select('*')
            .eq('id', profile.id)
            .single();
        
        const careersPromise = supabase
            .from('perfiles_carreras')
            .select('carreras (id, nombre)')
            .eq('usuario_id', profile.id);

        const [{ data: profileResult, error: profileError }, { data: careersResult, error: careersError }] = await Promise.all([profilePromise, careersPromise]);

        if (profileError) {
            setError('No se pudo cargar la información completa del perfil.');
        } else if (profileResult) {
            setProfileData({
                nombre1: profileResult.nombre1 || '',
                nombre2: profileResult.nombre2 || '',
                apellido1: profileResult.apellido1 || '',
                apellido2: profileResult.apellido2 || '',
                telefono: profileResult.telefono || '',
                fecha_nacimiento: profileResult.fecha_nacimiento || '',
                estado_verificacion: profileResult.estado_verificacion || 'no_solicitado',
            });
        }

        if (careersError) {
            setError('No se pudieron cargar las carreras.');
        } else if (careersResult) {
            const careers = careersResult.map(item => item.carreras).filter(Boolean) as Carrera[];
            setMyCareers(careers);
        }
        setLoadingCareers(false);
    }, [profile]);

    useEffect(() => {
        fetchFullProfile();
    }, [fetchFullProfile]);

    const handleVerificationUpload = () => {
        setSuccessMessage('Documento subido. Tu solicitud está pendiente de revisión por un administrador.');
        refreshProfile(); // Refresca el contexto de usuario
        fetchFullProfile(); // Refresca los datos locales de la página
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setUpdating(true);

        if (user) {
            const { error: updateError } = await supabase
                .from('perfiles')
                .update({
                    nombre1: profileData.nombre1.trim(),
                    nombre2: profileData.nombre2.trim() || null,
                    apellido1: profileData.apellido1.trim(),
                    apellido2: profileData.apellido2.trim() || null,
                    telefono: profileData.telefono.trim(),
                    fecha_nacimiento: profileData.fecha_nacimiento,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (updateError) {
                setError('Error al actualizar el perfil. Inténtalo de nuevo.');
            } else {
                setSuccessMessage('¡Perfil actualizado con éxito!');
                refreshProfile();
            }
        }
        setUpdating(false);
    };

    const handleDeactivate = () => {
        showModal({
            title: '¿Estás seguro de que deseas desactivar tu cuenta?',
            body: 'Esta acción marcará tu cuenta como inactiva y cerrará tu sesión. No podrás volver a iniciar sesión.',
            confirmText: 'Sí, desactivar',
            onConfirm: async () => {
                if (user) {
                    const { error: deactivateError } = await supabase
                        .from('perfiles')
                        .update({ is_active: false })
                        .eq('id', user.id);

                    if (deactivateError) {
                        setError('No se pudo desactivar la cuenta. Inténtalo más tarde.');
                    } else {
                        await supabase.auth.signOut();
                        navigate('/auth/login');
                    }
                }
            }
        });
    };

    const renderVerificationStatus = () => {
        switch (profileData.estado_verificacion) {
            case 'pendiente':
                return (
                    <Alert color="warning" className="mt-4">
                        Tu solicitud de verificación de carrera está pendiente de revisión.
                    </Alert>
                );
            case 'rechazado':
            case 'no_solicitado':
                return <SolicitarAccesoCarrera onUploadComplete={handleVerificationUpload} />;
            case 'verificado':
                return null; // No mostrar nada si ya está verificado
            default:
                return null;
        }
    };

    if (userLoading) {
        return <div className="p-4 flex justify-center"><Spinner /></div>;
    }

    return (
        <div className="p-4 md:p-6">
            <h1 className="text-2xl font-semibold mb-6">Mi Perfil</h1>
            <div className="flex flex-col md:flex-row gap-8">
                
                <div className="w-full md:w-1/3 flex flex-col items-center">
                    <UserAvatar nombre={profileData.nombre1} apellido={profileData.apellido1} size={120} />
                    <h2 className="text-xl font-bold mt-4">{profileData.nombre1} {profileData.apellido1}</h2>
                    <p className="text-gray-500">{user?.email}</p>

                    <div className="mt-6 w-full text-center">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Mis Carreras Verificadas</h3>
                        <div className="flex flex-wrap gap-2 mt-2 justify-center">
                            {loadingCareers ? <Spinner size="sm" /> : (
                                myCareers.length > 0 ? (
                                    myCareers.map(career => (
                                        <Badge key={career.id} color="info" size="sm">{career.nombre}</Badge>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">Aún no tienes carreras verificadas.</p>
                                )
                            )}
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-2/3">
                    <form onSubmit={handleUpdate}>
                        {error && <Alert color="failure" className="mb-4">{error}</Alert>}
                        {successMessage && <Alert color="success" className="mb-4">{successMessage}</Alert>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Campos del formulario... */}
                            <div>
                                <Label htmlFor="nombre1" value="Primer Nombre" />
                                <TextInput id="nombre1" name="nombre1" type="text" required onChange={handleChange} value={profileData.nombre1} />
                            </div>
                            <div>
                                <Label htmlFor="nombre2" value="Segundo Nombre (Opcional)" />
                                <TextInput id="nombre2" name="nombre2" type="text" onChange={handleChange} value={profileData.nombre2} />
                            </div>
                            <div>
                                <Label htmlFor="apellido1" value="Primer Apellido" />
                                <TextInput id="apellido1" name="apellido1" type="text" required onChange={handleChange} value={profileData.apellido1} />
                            </div>
                            <div>
                                <Label htmlFor="apellido2" value="Segundo Apellido (Opcional)" />
                                <TextInput id="apellido2" name="apellido2" type="text" onChange={handleChange} value={profileData.apellido2} />
                            </div>
                            <div>
                                <Label htmlFor="telefono" value="Teléfono" />
                                <TextInput id="telefono" name="telefono" type="tel" maxLength={10} required onChange={handleChange} value={profileData.telefono} />
                            </div>
                            <div>
                                <Label htmlFor="fecha_nacimiento" value="Fecha de Nacimiento" />
                                <TextInput id="fecha_nacimiento" name="fecha_nacimiento" type="date" required onChange={handleChange} value={profileData.fecha_nacimiento} />
                            </div>
                        </div>
                        
                        <Button color="primary" type="submit" disabled={updating}>
                            {updating ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </form>

                    {/* --- SECCIÓN DE VERIFICACIÓN DE CARRERA --- */}
                    <div className="mt-6 pt-6 border-t">
                        <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-semibold">Verificación de Carrera</h3>
                            <Badge color={
                                profileData.estado_verificacion === 'verificado' ? 'success' :
                                profileData.estado_verificacion === 'pendiente' ? 'warning' :
                                profileData.estado_verificacion === 'rechazado' ? 'failure' : 'gray'
                            }>
                                {profileData.estado_verificacion.replace('_', ' ')}
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Sube un nuevo documento si deseas que un administrador verifique tu acceso a carreras adicionales. Tu estado cambiará a "pendiente".
                        </p>
                        <SolicitarAccesoCarrera onUploadComplete={handleVerificationUpload} />
                    </div>


                    <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-red-600">Desactivar Cuenta</h2>
                        <p className="my-2 text-sm text-gray-600">
                            Esta acción marcará tu cuenta como inactiva y cerrará tu sesión. No podrás volver a iniciar sesión.
                        </p>
                        <Button color="failure" onClick={handleDeactivate}>
                            Desactivar mi cuenta
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MiPerfil;