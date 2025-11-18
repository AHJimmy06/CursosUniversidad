import { RouterProvider } from "react-router-dom";
import { Flowbite, ThemeModeScript } from 'flowbite-react';
import customTheme from './utils/theme/custom-theme';
import router from "./routes/Router";
import { UserProvider } from "./contexts/UserContext";
import { ModalProvider } from "./contexts/ModalContext";
import { useEffect } from 'react';
import { ThemeProvider } from "./contexts/ThemeContext";
import { useThemeConfig } from "./contexts/ThemeContext";
import Spinner from "./views/spinner/Spinner";

function AppContent() {
  const { config, isLoading } = useThemeConfig();

  useEffect(() => {
    if (!isLoading) {
      const root = document.documentElement;
      const colors = config.colores;
      
      root.style.setProperty('--color-primary', colors.primario);
      root.style.setProperty('--color-secondary', colors.secundario);
      root.style.setProperty('--color-primary-emphasis', colors.primary_emphasis);
      root.style.setProperty('--color-secondary-emphasis', colors.secondary_emphasis);
      root.style.setProperty('--color-lightprimary', colors.lightprimary);
      root.style.setProperty('--color-lightsecondary', colors.lightsecondary);
      root.style.setProperty('--color-info', colors.info);
      root.style.setProperty('--color-lightinfo', colors.lightinfo);
      root.style.setProperty('--color-info-emphasis', colors.info_emphasis);
    }
  }, [config, isLoading]);

  if (isLoading) {
    return <Spinner />;
  }

  return <RouterProvider router={router} />;
}

function App() {
  return (
    <>
      <ThemeModeScript />
      <Flowbite theme={{ theme: customTheme }}>
        <UserProvider>
          <ThemeProvider>
            <ModalProvider>
              <AppContent />
            </ModalProvider>
          </ThemeProvider>
        </UserProvider>
      </Flowbite>
    </>
  );
}

export default App;