import { Link } from 'react-router-dom';
import { useThemeConfig } from '../../../../contexts/ThemeContext';

const Logo = () => {
  const { config } = useThemeConfig();

  return (
    <Link to={'/'}>
      <img
        src={config.logo_url}
        alt="logo"
        width="40"
        height="40"
        style={{ maxHeight: '40px', width: 'auto', objectFit: 'contain' }}
      />
    </Link>
  )
}

export default Logo;