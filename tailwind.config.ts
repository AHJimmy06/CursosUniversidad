import type { Config } from "tailwindcss";
// --- CORRECCIÓN DE SINTAXIS: Usar 'import' en lugar de 'require' ---
import flowbite from "flowbite-react/tailwind";
import flowbitePlugin from "flowbite/plugin";
import typographyPlugin from "@tailwindcss/typography";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    flowbite.content(),
  ],

  theme: {
    fontFamily: {
      sans: ['Inter', 'sans-serif']
    },
    // --- NO TOCADO: Dejamos tus configuraciones personalizadas intactas ---
    extend: {
      boxShadow: {
        md: "0px 2px 4px -1px rgba(175, 182, 201, 0.2);",
        lg: "0 1rem 3rem rgba(0, 0, 0, 0.175)",
        "dark-md": "rgba(145, 158, 171, 0.3) 0px 0px 2px 0px, rgba(145, 158, 171, 0.02) 0px 12px 24px -4px",
        sm: "0 6px 24.2px -10px rgba(41, 52, 61, .22)",
        "btn-shadow": "box-shadow: rgba(0, 0, 0, .05) 0 9px 17.5px",
        tw:"rgba(175, 182, 201, 0.2) 0px 2px 4px -1px",
        btnshdw: "0 17px 20px -8px rgba(77, 91, 236, .231372549)",
        elevation1:"0px 12px 30px -2px rgba(58,75,116,0.14);",
        elevation2:"0px 24px 24px -12px rgba(0,0,0,0.05);",
        elevation3:"0px 24px 24px -12px rgba(99,91,255,0.15);",
        elevation4:"0px 12px 12px -6px rgba(0,0,0,0.15);"
      },
      borderRadius: {
        sm: "6px",
        md: "9px",
        lg: "24px",
        tw: "12px",
        bb: "20px",
      },
      container: {
        center: true,
        padding: "20px",
      },
      letterSpacing: {
        tightest: "-.075em",
        tighter: "-.05em",
        tight: "-.025em",
        normal: "0",
        wide: ".025em",
        wider: ".05em",
        widest: "1.5px",
      },
      gap: { "30": "30px" },
      padding: { "30": "30px" },
      margin: { "30": "30px" },
      fontSize: {
        "15": "15px", "17": "17px", "13": "13px", "22": "22px", "28": "28px",
        "34": "34px", "40": "40px", "44": "44px", "50": "50px", "56": "56px", "64": "64px",
      },

      colors: {
        'primary': 'var(--color-primary)',
        'primary-emphasis': 'var(--color-primary-emphasis)',
        'lightprimary': 'var(--color-lightprimary)',
        
        'secondary': 'var(--color-secondary)',
        'secondary-emphasis': 'var(--color-secondary-emphasis)',
        'lightsecondary': 'var(--color-lightsecondary)',

        'info': "var(--color-info)",
        'success': "var(--color-success)",
        'warning': "var(--color-warning)",
        'error': "var(--color-error)",
        'lightsuccess': "var( --color-lightsuccess)",
        'lighterror': "var(--color-lighterror)",
        'lightinfo': "var(--color-lightinfo)",
        'lightwarning': "var(--color-lightwarning)",
        'border': "var(--color-border)",
        'bordergray': "var(--color-bordergray)",
        'lightgray': "var( --color-lightgray)",
        'muted': "var(--color-muted)",
        'lighthover': "var(--color-lighthover)",
        'surface': "var(--color-surface-ld)",
        'sky': "var(--color-sky)",
        'bodytext': "var(--color-bodytext)",
        'dark': "var(--color-dark)",
        'link': "var(--color-link)",
        'darklink': "var(--color-darklink)",
        'darkborder': "var(--color-darkborder)",
        'darkgray': "var(--color-darkgray)",
        'warning-emphasis': "var(--color-warning-emphasis)", // Nombre corregido
        'error-emphasis': "var(--color-error-emphasis)", // Nombre corregido
        'success-emphasis': "var(--color-success-emphasis)", // Nombre corregido
        'info-emphasis': "var(--color-info-emphasis)", // Nombre corregido
        'darkmuted': "var( --color-darkmuted)",
      },
    },
  },
  
  plugins: [
    // Usamos la variable importada
    flowbitePlugin,
    typographyPlugin,
  ],
};

export default config;