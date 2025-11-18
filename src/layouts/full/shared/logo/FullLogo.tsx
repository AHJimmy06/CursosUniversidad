import { Link } from 'react-router-dom';
import { useThemeConfig } from '../../../../contexts/ThemeContext';

const FullLogo = () => {
  const { config } = useThemeConfig();

  return (
    <Link to={"/"}>
      <img 
        src={config.logo_url}
        alt="logo" 
        className="block" 
        width="170" 
        style={{ height: 'auto', objectFit: 'contain' }}
        onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/170x40?text=Logo'; }}
      />
    </Link>
  );
};

export default FullLogo;