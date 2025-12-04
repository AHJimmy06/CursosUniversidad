import { Dropdown } from "flowbite-react";
import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router";
import { supabase } from "../../../utils/supabaseClient";
import { useUser } from "../../../contexts/UserContext";
import UserAvatar from "../../../components/shared/UserAvatar";

const Profile = () => {
  const navigate = useNavigate();
  const { profile, loading } = useUser();
  const isAdmin = profile?.rol === 'administrador';

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate("/auth/login");
    }
  };

  if (loading) return null;

  return (
    <div className="relative group/menu">
      <Dropdown
        label=""
        className="rounded-sm w-44"
        dismissOnClick={true}
        renderTrigger={() => (
          <span className="h-10 w-10 hover:bg-lightprimary rounded-full flex justify-center items-center cursor-pointer">
            <UserAvatar nombre={profile?.nombre1} apellido={profile?.apellido1} />
          </span>
        )}
      >
        <Dropdown.Item
          as={Link}
          to="/perfil"
          className="px-3 py-3 flex items-center bg-hover group/link w-full gap-3 text-dark"
        >
          <Icon icon="solar:user-circle-outline" height={20} />
          Mi Perfil
        </Dropdown.Item>
        {isAdmin && (
          <Dropdown.Item
            as={Link}
            to="/configuracion"
            className="px-3 py-3 flex items-center bg-hover group/link w-full gap-3 text-dark"
          >
            <Icon icon="solar:settings-linear" height={20} />
            Configuración
          </Dropdown.Item>
        )}
        <Dropdown.Item
          onClick={handleLogout}
          className="px-3 py-3 flex items-center bg-hover group/link w-full gap-3 text-red-600"
        >
          <Icon icon="solar:logout-3-linear" height={20} />
          Cerrar Sesión
        </Dropdown.Item>
      </Dropdown>
    </div>
  );
};

export default Profile;