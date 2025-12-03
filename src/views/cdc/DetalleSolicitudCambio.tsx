import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { SolicitudDeCambio, RfcPir, ChangeRequestStatus } from '../../types/cdc';
import { Spinner, Alert, Card, Label, TextInput, Button, Select, Badge, Textarea } from 'flowbite-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useModal } from '../../contexts/ModalContext';
import { useUser } from '../../contexts/UserContext';
import { HiX } from 'react-icons/hi';
import { FaGithub } from 'react-icons/fa'; // Import the GitHub icon

// Mover tipos fuera para limpieza
type CabMember = { id: string; nombre1: string; apellido1: string; };
type LiderTecnico = { id: string; nombre1: string; apellido1: string; };
type Voto = {
  id: number;
  decision: boolean;
  comentarios: string;
  aprobador_id: string;
  aprobador: { nombre1: string; apellido1: string; };
};

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'aprobada':
    case 'completada':
      return 'success';
    case 'pendiente_revision':
    case 'pendiente_cab':
      return 'warning';
    case 'rechazada':
    case 'cancelada':
      return 'failure';
    case 'en_progreso':
    case 'pendiente_pir':
      return 'info';
    case 'cerrada':
      return 'gray';
    default:
      return 'dark';
  }
};

const getPriorityBadgeColor = (priority: string) => {
  switch (priority) {
    case 'critica':
      return 'failure';
    case 'alta':
      return 'warning';
    case 'media':
      return 'indigo';
    case 'baja':
      return 'gray';
    default:
      return 'dark';
  }
};

const getModelBadgeColor = (model: string) => {
  switch (model) {
    case 'estandar':
      return 'success';
    case 'emergencia':
      return 'failure';
    case 'normal':
    default:
      return 'info';
  }
};

const DetalleSolicitudCambio = () => {
  const { id } = useParams<{ id: string }>();
  const { showModal } = useModal();
  const { profile: currentUserProfile } = useUser();

  // Component State
  const [solicitud, setSolicitud] = useState<SolicitudDeCambio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for CAB members
  const [potentialCabMembers, setPotentialCabMembers] = useState<CabMember[]>([]);
  const [stagedCabMembers, setStagedCabMembers] = useState<CabMember[]>([]);
  const [loadingCab, setLoadingCab] = useState(true);
  const [savingCab, setSavingCab] = useState(false);

  // State for Lideres Tecnicos
  const [potentialLideres, setPotentialLideres] = useState<LiderTecnico[]>([]);
  const [stagedLideres, setStagedLideres] = useState<LiderTecnico[]>([]);
  const [loadingLideres, setLoadingLideres] = useState(true);
  const [savingLideres, setSavingLideres] = useState(false);
  const [searchQueryLideres, setSearchQueryLideres] = useState('');

  // State for ECAB members
  const [potentialEcabMembers, setPotentialEcabMembers] = useState<CabMember[]>([]);
  const [stagedEcabMembers, setStagedEcabMembers] = useState<CabMember[]>([]);
  const [loadingEcab, setLoadingEcab] = useState(true);
  const [savingEcab, setSavingEcab] = useState(false);

  // State for Votes
  const [votos, setVotos] = useState<Voto[]>([]);
  const [loadingVotos, setLoadingVotos] = useState(true);
  const [comentarioVoto, setComentarioVoto] = useState('');
  const [comentarioVotoEcab, setComentarioVotoEcab] = useState('');
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);

  // State for PIR
  const [pirData, setPirData] = useState<RfcPir | null>(null);
  const [pirExitoso, setPirExitoso] = useState(true);
  const [pirNotas, setPirNotas] = useState('');
  const [savingPir, setSavingPir] = useState(false);

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchQueryEcab, setSearchQueryEcab] = useState('');
  const [selectedModel, setSelectedModel] = useState<SolicitudDeCambio['modelo']>('normal');
  const [selectedPriority, setSelectedPriority] = useState<SolicitudDeCambio['prioridad']>('media');
  const [savingStatus, setSavingStatus] = useState(false);
  const [prLink, setPrLink] = useState('');

  const markdownPlugins = useMemo(() => [remarkGfm], []);

  useEffect(() => {
    let isActive = true;

    const fetchAllData = async () => {
      if (!id) return;
      
      try {
        if (isActive) setLoading(true);

        const { data: solicitudData, error: solicitudError } = await supabase
          .from('solicitudes_de_cambio')
          .select('*, solicitante:solicitante_id(nombre1, apellido1)')
          .eq('id', id)
          .single();

        if (solicitudError) throw solicitudError;
        if (!isActive) return;

        setSolicitud(solicitudData as SolicitudDeCambio);
        setSelectedModel(solicitudData.modelo);
        setSelectedPriority(solicitudData.prioridad);
        
        const [
          cabUsersResponse, 
          assignedCabResponse, 
          votosResponse, 
          lideresResponse, 
          assignedLideresResponse,
          pirResponse,
          ecabUsersResponse, // Add response for ECAB members
        ] = await Promise.all([
          supabase.rpc('get_users_by_cdc_role', { role_name: 'Miembro CAB' }),
          supabase.from('rfc_cab_miembros').select('miembro_id').eq('solicitud_id', id),
          supabase.from('rfc_aprobaciones').select('*, aprobador:aprobador_id(nombre1, apellido1)').eq('solicitud_id', id),
          supabase.rpc('get_users_by_cdc_role', { role_name: 'Líder Técnico' }),
          supabase.from('rfc_desarrolladores_asignados').select('desarrollador_id').eq('solicitud_id', id),
          supabase.from('rfc_pir').select('*').eq('solicitud_id', id).limit(1).maybeSingle(),
          supabase.rpc('get_users_by_cdc_role', { role_name: 'Miembro ECAB' }), // Fetch ECAB members
        ]);

        if (!isActive) return;

        const { data: cabUsers, error: cabUsersError } = cabUsersResponse;
        if (cabUsersError) throw cabUsersError;
        setPotentialCabMembers(cabUsers);

        const { data: assignedCab, error: assignedCabError } = assignedCabResponse;
        if (assignedCabError) throw assignedCabError;
        const assignedCabIds = assignedCab.map(m => m.miembro_id);
        setStagedCabMembers(cabUsers.filter((u: CabMember) => assignedCabIds.includes(u.id)));

        const { data: ecabUsers, error: ecabUsersError } = ecabUsersResponse;
        if (ecabUsersError) throw ecabUsersError;
        setPotentialEcabMembers(ecabUsers);
        // For emergencies, all potential ECAB members are considered staged by default
        setStagedEcabMembers(ecabUsers); 
        setLoadingEcab(false);

        const { data: votosData, error: votosError } = votosResponse;
        if(votosError) throw votosError;
        setVotos(votosData as Voto[]);

        const { data: lideres, error: lideresError } = lideresResponse;
        if (lideresError) throw lideresError;
        setPotentialLideres(lideres);

        const { data: assignedLideres, error: assignedLideresError } = assignedLideresResponse;
        if (assignedLideresError) throw assignedLideresError;
        const assignedLideresIds = assignedLideres.map(d => d.desarrollador_id);
        setStagedLideres(lideres.filter((l: LiderTecnico) => assignedLideresIds.includes(l.id)));

        const { data: pirDataResponse, error: pirError } = pirResponse;
        if (pirError && pirError.code !== 'PGRST116') {
            throw pirError;
        }
        if (pirDataResponse) {
            setPirData(pirDataResponse);
            setPirExitoso(pirDataResponse.exitoso);
            setPirNotas(pirDataResponse.notas || '');
        }

      } catch (err: any) {
        if (isActive) setError(err.message);
      } finally {
        if (isActive) {
          setLoading(false);
          setLoadingCab(false);
          setLoadingVotos(false);
          setLoadingLideres(false);
        }
      }
    };

    fetchAllData();

    return () => {
      isActive = false;
    };
  }, [id]);

  const handleCompleteDevelopment = async () => {
    if (!prLink || !id) return;
    setSavingStatus(true);
    try {
      // 1. Guardar el enlace del PR
      const { error: prError } = await supabase
        .from('solicitudes_de_cambio')
        .update({ github_pr_url: prLink })
        .eq('id', id);
      
      if (prError) throw prError;

      // 2. Llamar a handleChangeStatus, que se encargará de la confirmación y el cambio de estado
      await handleChangeStatus('completada');

    } catch (err: any) {
      showModal({ title: 'Error', body: `No se pudo completar la solicitud: ${err.message}`, showCancel: false, confirmText: 'Cerrar' });
      setSavingStatus(false);
    }
  };

  const { isCabMemberForThisRequest, hasVoted } = useMemo(() => {
    // Solo necesitamos el perfil de usuario (para el ID) y la lista de miembros de la solicitud.
    // Si el ID del usuario actual o la lista de miembros del CAB no están disponibles,
    // retornamos false para indicar que el usuario no puede votar aún.
    if (!currentUserProfile?.id || stagedCabMembers.length === 0) {
      return { isCabMemberForThisRequest: false, hasVoted: false };
    }
    
    const isMember = stagedCabMembers.some(m => String(m.id) === String(currentUserProfile.id));
    const hasAlreadyVoted = votos.some(v => String(v.aprobador_id) === String(currentUserProfile.id));

    return {
      isCabMemberForThisRequest: isMember,
      hasVoted: hasAlreadyVoted
    };
  }, [currentUserProfile, stagedCabMembers, votos]);

  const isAssignedLiderTecnico = useMemo(() => {
    if (!currentUserProfile?.id || stagedLideres.length === 0) {
      return false;
    }
    return stagedLideres.some(l => String(l.id) === String(currentUserProfile.id));
  }, [currentUserProfile, stagedLideres]);

  const isEcabMember = useMemo(() => {
    if (!currentUserProfile?.id || stagedEcabMembers.length === 0) {
      return false;
    }
    return stagedEcabMembers.some(m => String(m.id) === String(currentUserProfile.id));
  }, [currentUserProfile, stagedEcabMembers]);

  const canManageRequest = useMemo(() => {
    const roles = currentUserProfile?.cdc_roles || [];
    return roles.includes('administrador') || roles.includes('Gestor de Cambios');
  }, [currentUserProfile]);

  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    const stagedIds = new Set(stagedCabMembers.map(m => m.id));
    return potentialCabMembers.filter(member =>
      !stagedIds.has(member.id) &&
      `${member.nombre1} ${member.apellido1}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, potentialCabMembers, stagedCabMembers]);

  const searchResultsEcab = useMemo(() => {
    if (!searchQueryEcab) return [];
    const stagedIds = new Set(stagedCabMembers.map(m => m.id));
    return potentialEcabMembers.filter(member =>
      !stagedIds.has(member.id) &&
      `${member.nombre1} ${member.apellido1}`.toLowerCase().includes(searchQueryEcab.toLowerCase())
    );
  }, [searchQueryEcab, potentialEcabMembers, stagedCabMembers]);

  const searchResultsLideres = useMemo(() => {
    if (!searchQueryLideres) return [];
    const stagedIds = new Set(stagedLideres.map(l => l.id));
    return potentialLideres.filter(lider =>
      !stagedIds.has(lider.id) &&
      `${lider.nombre1} ${lider.apellido1}`.toLowerCase().includes(searchQueryLideres.toLowerCase())
    );
  }, [searchQueryLideres, potentialLideres, stagedLideres]);

  const handleAddMember = (member: CabMember) => {
    setStagedCabMembers(prev => [...prev, member]);
    setSearchQuery('');
  };

  const handleRemoveMember = (memberId: string) => {
    setStagedCabMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const handleAddLider = (lider: LiderTecnico) => {
    setStagedLideres(prev => [...prev, lider]);
    setSearchQueryLideres('');
  };

  const handleRemoveLider = (liderId: string) => {
    setStagedLideres(prev => prev.filter(l => l.id !== liderId));
  };

  const handleChangeStatus = async (newStatus: SolicitudDeCambio['estado']) => {
    if (!id) return;

    // Don't show confirmation modal for automatic status changes from voting
    const confirmed = ['aprobada', 'rechazada'].includes(newStatus) 
      ? true 
      : await showModal({
          title: 'Confirmar Cambio de Estado',
          body: `¿Estás seguro de que quieres cambiar el estado a "${newStatus.replace(/_/g, ' ')}"?`,
          confirmText: 'Sí, cambiar estado'
      });

    if (!confirmed) return;
    setSavingStatus(true);
    
    try {
        await logCdcAction('ESTADO_CAMBIADO', { valor_anterior: solicitud?.estado, valor_nuevo: newStatus });

        const { data: updatedSolicitud, error } = await supabase
          .from('solicitudes_de_cambio')
          .update({ estado: newStatus })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        
        setSolicitud(updatedSolicitud as SolicitudDeCambio);
        showModal({ title: 'Éxito', body: 'Estado actualizado correctamente.', showCancel: false, confirmText: 'Aceptar' });
        
        if (newStatus === 'completada' && solicitud?.github_issue_number) {
            supabase.functions.invoke('update-github-issue-status', {
              body: { issue_number: solicitud.github_issue_number, state: 'closed' }
            }).catch(console.error);
        }
    } catch (err: any) {
        showModal({ title: 'Error', body: `Error al actualizar el estado: ${err.message}`, showCancel: false, confirmText: 'Cerrar' });
    } finally {
        setSavingStatus(false);
    }
  };

  const handleSavePir = async () => {
    if (!id || !currentUserProfile) return;
    setSavingPir(true);
    try {
        const { data, error } = await supabase
            .from('rfc_pir')
            .upsert({
                solicitud_id: parseInt(id, 10),
                revisor_id: currentUserProfile.id,
                exitoso: pirExitoso,
                notas: pirNotas,
            })
            .select()
            .single();
        if (error) throw error;
        setPirData(data);
        await handleChangeStatus('cerrada');
    } catch (err: any) {
        showModal({ title: 'Error', body: `No se pudo guardar la PIR: ${err.message}`, showCancel: false, confirmText: 'Cerrar' });
    } finally {
        setSavingPir(false);
    }
  };

  const checkAndAutoUpdateStatus = async (currentVotes: Voto[]) => {
    if (stagedCabMembers.length === 0 || currentVotes.length < stagedCabMembers.length) return;
    const hasRejection = currentVotes.some(v => v.decision === false);
    const newStatus = hasRejection ? 'rechazada' : 'aprobada';
    await handleChangeStatus(newStatus);
  };

  const handleCastVote = async (decision: boolean) => {
    if (!id || !currentUserProfile) return;
    
    const comment = solicitud?.modelo === 'emergencia' ? comentarioVotoEcab : comentarioVoto;
    if (!decision && !comment) {
      showModal({ title: 'Comentario Requerido', body: 'El comentario es obligatorio al rechazar una solicitud.', showCancel: false, confirmText: 'Entendido' });
      return;
    }

    setIsSubmittingVote(true);
    try {
      const { data: newVote, error } = await supabase.from('rfc_aprobaciones').upsert({
        solicitud_id: id,
        aprobador_id: currentUserProfile.id,
        decision,
        comentarios: comment
      }, {
        onConflict: 'solicitud_id,aprobador_id'
      }).select('*, aprobador:aprobador_id(nombre1, apellido1)').single();

      if (error) throw error;
      
      // Log the vote action
      await logCdcAction('VOTO_EMITIDO', { 
        notas: `Decisión: ${decision ? 'Aprobado' : 'Rechazado'}. Comentario: ${comment}` 
      });

      setComentarioVoto('');
      setComentarioVotoEcab('');

      const updatedVotes = votos.filter(v => String(v.aprobador_id) !== String(currentUserProfile.id));
      updatedVotes.push(newVote as Voto);
      setVotos(updatedVotes);

      await checkAndAutoUpdateStatus(updatedVotes);

    } catch (err: any) {
      showModal({ title: 'Error', body: err.message, showCancel: false, confirmText: 'Cerrar' });
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const renderMarkdown = (content: string | null | undefined, defaultText: string) => (
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={markdownPlugins}>{content || defaultText}</ReactMarkdown>
    </div>
  );

  const logCdcAction = async (
    accion: string,
    details: { valor_anterior?: any; valor_nuevo?: any; notas?: string } = {}
  ) => {
    if (!currentUserProfile || !solicitud) return;
    try {
      await supabase.from('cdc_audit_log').insert({
        solicitud_id: solicitud.id,
        actor_id: currentUserProfile.id,
        accion,
        ...details,
      });
    } catch (logError) {
      console.error('Failed to log CDC action:', logError); // Log silently without alerting the user
    }
  };

  const handlePrimaryAction = async () => {
    if (!id || !solicitud) return;

    const confirmTextMap = {
      estandar: 'Sí, aprobar',
      normal: 'Sí, enviar a CAB',
      emergencia: 'Sí, enviar a ECAB',
    };

    const confirmed = await showModal({
        title: 'Confirmar Acción',
        body: `Estás a punto de guardar los cambios y mover la solicitud al siguiente estado. ¿Continuar?`,
        confirmText: confirmTextMap[selectedModel],
    });

    if (!confirmed) return;
    setSavingStatus(true);

    try {
      let nextStatus: ChangeRequestStatus = solicitud.estado;
      
            // Log model change if it's different
      
            if (solicitud.modelo !== selectedModel) {
      
              await logCdcAction('MODELO_CAMBIADO', { valor_anterior: solicitud.modelo, valor_nuevo: selectedModel });
      
            }
      
      
      
            // Log priority change if it's different
      
            if (solicitud.prioridad !== selectedPriority) {
      
              await logCdcAction('PRIORIDAD_CAMBIADA', { valor_anterior: solicitud.prioridad, valor_nuevo: selectedPriority });
      
            }
      
      
      
            // Save assignments based on model
      
            switch (selectedModel) {
      
              case 'estandar':
      
                nextStatus = 'aprobada';
      
                await supabase.from('rfc_desarrolladores_asignados').delete().eq('solicitud_id', id);
      
                if (stagedLideres.length > 0) {
      
                  const newAssignments = stagedLideres.map(lider => ({ solicitud_id: id, desarrollador_id: lider.id }));
      
                  await supabase.from('rfc_desarrolladores_asignados').insert(newAssignments);
      
                  // Log leader assignments
      
                  for (const lider of stagedLideres) {
      
                    await logCdcAction('LIDER_ASIGNADO', { notas: `${lider.nombre1} ${lider.apellido1}` });
      
                  }
      
                }
      
                break;
      
              case 'normal':
      
              case 'emergencia':
      
                nextStatus = 'pendiente_cab';
      
                await supabase.from('rfc_cab_miembros').delete().eq('solicitud_id', id);
      
                if (stagedCabMembers.length > 0) {
      
                  const newMembers = stagedCabMembers.map(member => ({ solicitud_id: id, miembro_id: member.id }));
      
                  await supabase.from('rfc_cab_miembros').insert(newMembers);
      
                  // Log member assignments
      
                  const logNotaPrefix = selectedModel === 'normal' ? 'Miembro CAB Asignado' : 'Miembro ECAB Asignado';
      
                  for (const member of stagedCabMembers) {
      
                    await logCdcAction('MIEMBRO_ASIGNADO', { notas: `${logNotaPrefix}: ${member.nombre1} ${member.apellido1}` });
      
                  }
      
                }
      
                
      
                await supabase.from('rfc_desarrolladores_asignados').delete().eq('solicitud_id', id);
      
                if (stagedLideres.length > 0) {
      
                  const newAssignments = stagedLideres.map(lider => ({ solicitud_id: id, desarrollador_id: lider.id }));
      
                  await supabase.from('rfc_desarrolladores_asignados').insert(newAssignments);
      
                  // Log leader assignments
      
                  for (const lider of stagedLideres) {
      
                    await logCdcAction('LIDER_ASIGNADO', { notas: `Líder Técnico: ${lider.nombre1} ${lider.apellido1}` });
      
                  }
      
                }
      
                break;
      
            }
      
            
      
            // Log status change
      
            if (solicitud.estado !== nextStatus) {
      
              await logCdcAction('ESTADO_CAMBIADO', { valor_anterior: solicitud.estado, valor_nuevo: nextStatus });
      
            }
      
      
      
            const updateData: Partial<SolicitudDeCambio> = { 
      
              modelo: selectedModel,
      
              prioridad: selectedPriority,
      
              estado: nextStatus 
      
            };
      
      
      
            if (selectedModel === 'emergencia') {
      
              updateData.estado_ecab = 'pendiente_aprobacion_ecab' as any;
      
            }

      const { data: updatedSolicitud, error } = await supabase.from('solicitudes_de_cambio').update(updateData).eq('id', id).select().single();
      
      if (error) throw error;

      setSolicitud(updatedSolicitud as SolicitudDeCambio);
      showModal({ title: 'Éxito', body: 'La solicitud ha sido procesada correctamente.', showCancel: false, confirmText: 'Aceptar' });

    } catch (err: any) {
      showModal({ title: 'Error', body: `Error al procesar la solicitud: ${err.message}`, showCancel: false, confirmText: 'Cerrar' });
    } finally {
      setSavingStatus(false);
    }
  };

  const renderPrimaryAction = () => {
    if (!solicitud || !['borrador', 'pendiente_revision'].includes(solicitud.estado)) return null;

    const ActionButton = ({ onClick, children, color = 'info', disabled = false, title = '' }: { onClick: () => void; children: React.ReactNode; color?: string; disabled?: boolean, title?: string }) => (
      <div title={title}>
        <Button color={color} onClick={onClick} isProcessing={savingStatus} disabled={savingStatus || disabled} fullSized>
          {children}
        </Button>
      </div>
    );

    switch (selectedModel) {
      case 'estandar':
        const isStandardDisabled = stagedLideres.length === 0;
        return (
          <ActionButton
            onClick={() => handlePrimaryAction()}
            color="success"
            disabled={isStandardDisabled}
            title={isStandardDisabled ? "Debe asignar al menos un líder técnico" : "Aprobar y guardar asignación"}
          >
            Aprobar (Estándar)
          </ActionButton>
        );
      case 'normal':
         const isNormalDisabled = stagedCabMembers.length === 0;
        return (
          <ActionButton
            onClick={() => handlePrimaryAction()}
            color="info"
            disabled={isNormalDisabled}
            title={isNormalDisabled ? "Debe asignar al menos un miembro del CAB" : "Guardar y enviar a votación"}
          >
            Enviar a CAB y Guardar
          </ActionButton>
        );
      case 'emergencia':
        const isEmergencyDisabled = stagedCabMembers.length === 0;
        return (
          <ActionButton
            onClick={() => handlePrimaryAction()}
            color="failure"
            disabled={isEmergencyDisabled}
            title={isEmergencyDisabled ? "Debe asignar al menos un miembro del ECAB" : "Guardar y enviar a aprobación urgente"}
          >
            Enviar a ECAB y Guardar
          </ActionButton>
        );
      default:
        return null;
    }
  };

  const showVotingCard = isCabMemberForThisRequest && solicitud?.estado === 'pendiente_cab' && solicitud?.modelo === 'normal';
  const showEcabVotingCard = isEcabMember && solicitud?.estado === 'pendiente_cab' && solicitud?.modelo === 'emergencia';
  const showPirCard = canManageRequest && ['completada', 'pendiente_pir', 'cerrada'].includes(solicitud?.estado || '');
  const showAdminCards = canManageRequest && !['cerrada', 'cancelada', 'rechazada'].includes(solicitud?.estado || '');

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner size="xl" /></div>;
  if (error) return <Alert color="failure">{error}</Alert>;
  if (!solicitud) return <Alert color="warning">No se encontró la solicitud.</Alert>;

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-4">{solicitud.titulo}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {showPirCard && pirData && (
             <Card>
                <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Revisión Post-Implementación (PIR)</h2>
                <div className="space-y-4">
                    <div>
                        <span className="font-semibold">Resultado:</span>
                        <Badge color={pirData.exitoso ? 'success' : 'failure'} className="ml-2 inline-block">
                            {pirData.exitoso ? 'Exitoso' : 'Fallido'}
                        </Badge>
                    </div>
                    <div>
                        <span className="font-semibold">Notas de la Revisión:</span>
                        {renderMarkdown(pirData.notas, 'No se proporcionaron notas.')}
                    </div>
                </div>
            </Card>
          )}

          <Card><h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Descripción</h2>{renderMarkdown(solicitud.descripcion, 'No proporcionada')}</Card>
          {showPirCard && !pirData && (
             <Card>
                <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Revisión Post-Implementación (PIR)</h2>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="pir-exitoso"
                            checked={pirExitoso}
                            onChange={(e) => setPirExitoso(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor="pir-exitoso">¿El cambio fue exitoso?</Label>
                    </div>
                    <div>
                        <Label htmlFor="pir-notas" value="Notas de la Revisión" />
                        <Textarea 
                            id="pir-notas"
                            value={pirNotas}
                            onChange={(e) => setPirNotas(e.target.value)}
                            rows={4}
                            placeholder="Describe el resultado, los problemas encontrados y las lecciones aprendidas..."
                        />
                    </div>
                    <Button onClick={handleSavePir} isProcessing={savingPir} disabled={savingPir}>
                        Guardar y Cerrar Solicitud
                    </Button>
                </div>
            </Card>
          )}

          <Card>
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Votos del Comité</h2>
            {loadingVotos || loadingCab ? <Spinner /> : (
              <div className="space-y-4">
                {stagedCabMembers.length > 0 ? (
                  stagedCabMembers.map(member => {
                    const vote = votos.find(v => v.aprobador_id === member.id);
                    return (
                      <div key={member.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {member.nombre1} {member.apellido1}
                          </span>
                          {vote ? (
                            <Badge color={vote.decision ? 'success' : 'failure'}>
                              {vote.decision ? 'Aprobado' : 'Rechazado'}
                            </Badge>
                          ) : (
                            <Badge color="gray">Pendiente de Voto</Badge>
                          )}
                        </div>
                        {vote && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{vote.comentarios}</p>
                        )}
                      </div>
                    );
                  })
                ) : <p className="text-sm text-gray-500">No hay miembros del CAB asignados.</p>}
              </div>
            )}
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card>
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Detalles</h2>
            <div className="space-y-2 text-gray-700 dark:text-gray-400">
              <div className="flex justify-between items-center">
                <span className="font-bold">Solicitante:</span>
                <span>{solicitud.solicitante ? `${solicitud.solicitante.nombre1} ${solicitud.solicitante.apellido1}` : 'Sistema'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold">Estado:</span>
                <Badge color={getStatusBadgeColor(solicitud.estado)} className="capitalize">{solicitud.estado.replace(/_/g, ' ')}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold">Prioridad:</span>
                <Badge color={getPriorityBadgeColor(solicitud.prioridad)} className="capitalize">{solicitud.prioridad}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold">Modelo:</span>
                <Badge color={getModelBadgeColor(solicitud.modelo)} className="capitalize">{solicitud.modelo}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold">Creado:</span>
                <span>{new Date(solicitud.created_at).toLocaleString()}</span>
              </div>
              {solicitud.github_issue_url && (
                <div className="flex justify-end pt-2">
                  <Button outline color="gray" href={solicitud.github_issue_url} target="_blank" rel="noopener noreferrer" className="items-center">
                    <FaGithub className="mr-2 h-4 w-4" />
                    Ver Issue en GitHub
                  </Button>
                </div>
              )}
              {solicitud.github_pr_url && (
                <div className="flex justify-end pt-2">
                  <Button outline color="gray" href={solicitud.github_pr_url} target="_blank" rel="noopener noreferrer" className="items-center">
                    <FaGithub className="mr-2 h-4 w-4" />
                    Ver PR en GitHub
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {isAssignedLiderTecnico && (solicitud.estado === 'aprobada' || solicitud.estado === 'en_progreso') && (
            <Card>
              <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Acciones de Desarrollo</h2>
              {solicitud.estado === 'aprobada' && (
                <Button color="success" onClick={() => handleChangeStatus('en_progreso')} isProcessing={savingStatus} disabled={savingStatus}>
                  Iniciar Implementación
                </Button>
              )}
              {solicitud.estado === 'en_progreso' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="pr-link" value="Enlace del Pull Request (PR)" className="mb-2 block" />
                    <TextInput
                      id="pr-link"
                      type="url"
                      placeholder="https://github.com/..."
                      required
                      value={prLink}
                      onChange={(e) => setPrLink(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleCompleteDevelopment} color="success" isProcessing={savingStatus} disabled={!prLink || savingStatus}>
                    Marcar como Completada
                  </Button>
                </div>
              )}
            </Card>
          )}
          
          {showVotingCard && (
            <Card>
              <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Emitir Voto</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="vote-comment" value="Comentarios (Opcional)" />
                  <Textarea id="vote-comment" value={comentarioVoto} onChange={(e) => setComentarioVoto(e.target.value)} rows={3} />
                </div>
                <div className="flex gap-4">
                  <Button color="success" onClick={() => handleCastVote(true)} isProcessing={isSubmittingVote} disabled={isSubmittingVote} className="flex-1">Aprobar</Button>
                  <Button color="failure" onClick={() => handleCastVote(false)} isProcessing={isSubmittingVote} disabled={isSubmittingVote} className="flex-1">Rechazar</Button>
                </div>
              </div>
            </Card>
          )}

          {showEcabVotingCard && (
            <Card>
              <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Emitir Voto de Emergencia (ECAB)</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ecab-vote-comment" value="Comentarios (Requerido para Rechazo)" />
                  <Textarea id="ecab-vote-comment" value={comentarioVotoEcab} onChange={(e) => setComentarioVotoEcab(e.target.value)} rows={3} />
                </div>
                <div className="flex gap-4">
                  <Button color="success" onClick={() => handleCastVote(true)} isProcessing={isSubmittingVote} disabled={isSubmittingVote} className="flex-1">Aprobar (ECAB)</Button>
                  <Button color="failure" onClick={() => handleCastVote(false)} isProcessing={isSubmittingVote} disabled={isSubmittingVote} className="flex-1">Rechazar (ECAB)</Button>
                </div>
              </div>
            </Card>
          )}

          {showAdminCards && (
            <>
              <Card>
                <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Administrar Solicitud</h2>

                {['borrador', 'pendiente_revision'].includes(solicitud.estado) && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="model-select" value="Modelo de Cambio" />
                        <Select id="model-select" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value as SolicitudDeCambio['modelo'])}>
                          <option value="normal">Normal</option>
                          <option value="estandar">Estándar</option>
                          <option value="emergencia">Emergencia</option>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="priority-select" value="Prioridad" />
                        <Select id="priority-select" value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value as SolicitudDeCambio['prioridad'])}>
                          <option value="baja">Baja</option>
                          <option value="media">Media</option>
                          <option value="alta">Alta</option>
                          <option value="critica">Crítica</option>
                        </Select>
                      </div>
                    </div>

                    {/* Primary Action Button will be rendered here */}
                    <div className="pt-4 border-t">
                      {renderPrimaryAction()}
                    </div>
                  </div>
                )}

                {/* Secondary Actions */}
                <div className="pt-4 border-t mt-4">
                  <Button color="failure" size="sm" onClick={() => handleChangeStatus('cancelada')}>
                    Cancelar Solicitud
                  </Button>
                </div>
              </Card>

              {selectedModel === 'normal' && (
                <Card>
                  <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Miembros del CAB</h2>
                  {loadingCab ? <Spinner /> : (
                    <>
                      {['borrador', 'pendiente_revision'].includes(solicitud.estado) ? (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="cab-search" value="Añadir Miembro" />
                            <TextInput id="cab-search" type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar..." />
                            {searchResults.length > 0 && (
                              <div key="cab-search-results" className="mt-2 border rounded-md bg-gray-50 dark:bg-gray-700 max-h-40 overflow-y-auto">
                                {searchResults.map(member => (
                                  <div key={member.id} onClick={() => handleAddMember(member)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                                    {member.nombre1} {member.apellido1}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-md font-semibold mb-2">Asignados</h3>
                            {stagedCabMembers.length > 0 ? (
                              <ul className="space-y-2">
                                {stagedCabMembers.map(member => (
                                  <li key={member.id} className="flex justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                                    <span>{member.nombre1} {member.apellido1}</span>
                                    <button onClick={() => handleRemoveMember(member.id)} className="text-red-500"><HiX /></button>
                                  </li>
                                ))}
                              </ul>
                                                        ) : <p className="text-sm text-gray-500">Sin miembros.</p>}
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <div>
                                                    <h3 className="text-md font-semibold mb-2">Asignados</h3>                          {stagedCabMembers.length > 0 ? (
                            <ul className="space-y-2">
                              {stagedCabMembers.map(member => (
                                <li key={member.id} className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                                  <span>{member.nombre1} {member.apellido1}</span>
                                </li>
                              ))}
                            </ul>
                          ) : <p className="text-sm text-gray-500">Sin miembros asignados.</p>}
                        </div>
                      )}
                    </>
                  )}
                </Card>
              )}

              {selectedModel === 'emergencia' && (
                <Card>
                  <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Miembros del ECAB (Comité de Emergencia)</h2>
                  {loadingEcab ? <Spinner /> : (
                    <div className="space-y-4">
                      {['borrador', 'pendiente_revision'].includes(solicitud.estado) ? (
                        <>
                          <div>
                            <Label htmlFor="ecab-search" value="Añadir Miembro del ECAB" />
                            <TextInput id="ecab-search" type="text" value={searchQueryEcab} onChange={(e) => setSearchQueryEcab(e.target.value)} placeholder="Buscar por nombre..." />
                            {searchResultsEcab.length > 0 && (
                              <div className="mt-2 border rounded-md bg-gray-50 dark:bg-gray-700 max-h-40 overflow-y-auto">
                                {searchResultsEcab.map(member => (
                                  <div key={member.id} onClick={() => handleAddMember(member)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                                    {member.nombre1} {member.apellido1}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-md font-semibold mb-2">Asignados al ECAB</h3>
                            {stagedCabMembers.length > 0 ? (
                              <ul className="space-y-2">
                                {stagedCabMembers.map(member => (
                                  <li key={member.id} className="flex justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                                    <span>{member.nombre1} {member.apellido1}</span>
                                    <button onClick={() => handleRemoveMember(member.id)} className="text-red-500"><HiX /></button>
                                  </li>
                                ))}
                              </ul>
                            ) : <p className="text-sm text-gray-500">Sin miembros asignados.</p>}
                          </div>
                        </>
                      ) : (
                        <div>
                          <h3 className="text-md font-semibold mb-2">Miembros Asignados</h3>
                          {stagedCabMembers.length > 0 ? (
                            <ul className="space-y-2">
                              {stagedCabMembers.map(member => (
                                <li key={member.id} className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                                  <span>{member.nombre1} {member.apellido1}</span>
                                </li>
                              ))}
                            </ul>
                          ) : <p className="text-sm text-gray-500">No hay miembros del ECAB asignados.</p>}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )}
          
              <Card>
                <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Líderes Técnicos</h2>
                {loadingLideres ? <Spinner /> : (
                  <>
                      {['borrador', 'pendiente_revision'].includes(solicitud.estado) ? (
                        <div>
                          <TextInput placeholder="Buscar líder..." value={searchQueryLideres} onChange={(e) => setSearchQueryLideres(e.target.value)} />
                           {searchResultsLideres.length > 0 && (
                            <div key="lider-search-results" className="mt-2 border rounded-md bg-gray-50 dark:bg-gray-700 max-h-40 overflow-y-auto">
                              {searchResultsLideres.map(lider => (
                                <div key={lider.id} onClick={() => handleAddLider(lider)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                                  {lider.nombre1} {lider.apellido1}
                                </div>
                              ))}
                            </div>
                          )}
                          <h3 className="text-md font-semibold mb-2">Asignados</h3>
                          {stagedLideres.length > 0 ? (
                            <ul className="space-y-2">
                              {stagedLideres.map(lider => (
                                <li key={lider.id} className="flex justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                                  <span>{lider.nombre1} {lider.apellido1}</span>
                                  <button onClick={() => handleRemoveLider(lider.id)} className="text-red-500"><HiX /></button>
                                </li>
                              ))}
                            </ul>
                          ) : <p className="text-sm text-gray-500">Sin líderes asignados.</p>}
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-md font-semibold mb-2">Asignados</h3>
                           {stagedLideres.length > 0 ? (
                            <ul className="space-y-2">
                              {stagedLideres.map(lider => (
                                <li key={lider.id} className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                                  <span>{lider.nombre1} {lider.apellido1}</span>
                                </li>
                              ))}
                            </ul>
                          ) : <p className="text-sm text-gray-500">Sin líderes asignados.</p>}
                        </div>
                      )}
                    </>
                  )}
                </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetalleSolicitudCambio;