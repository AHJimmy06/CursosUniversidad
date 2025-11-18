interface AvatarProps {
  nombre?: string | null;
  apellido?: string | null;
  size?: number;
}

const UserAvatar = ({ nombre, apellido, size = 35 }: AvatarProps) => {
  const initials = `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase();

  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
  };
  
  const bgColor = stringToColor(nombre || 'U');

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: bgColor,
      }}
      className="rounded-full flex justify-center items-center text-white font-semibold"
    >
      {initials}
    </div>
  );
};

export default UserAvatar;