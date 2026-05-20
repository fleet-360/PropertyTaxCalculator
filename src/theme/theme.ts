'use client';
import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    brand: {
      navyDeep: string;
      navyMid: string;
      navyLight: string;
      blue: string;
      blueDark: string;
      blueLight: string;
      gridLine: string;
    };
  }
  interface PaletteOptions {
    brand?: {
      navyDeep: string;
      navyMid: string;
      navyLight: string;
      blue: string;
      blueDark: string;
      blueLight: string;
      gridLine: string;
    };
  }
}

const theme = createTheme({
  direction: 'rtl',
  palette: {
    primary: {
      main: '#1a1a1a',
      light: '#4a4a4a',
      dark: '#000000',
    },
    secondary: {
      main: '#F28B00',
      light: '#FFB547',
      dark: '#C66D00',
    },
    background: {
      default: '#FAF5EE',
      paper: '#ffffff',
    },
    success: {
      main: '#2e7d32',
    },
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#f59e0b',
    },
    brand: {
      navyDeep: '#0B1A47',
      navyMid: '#152762',
      navyLight: '#1E3580',
      blue: '#1A56E0',
      blueDark: '#1247C2',
      blueLight: '#3D78F0',
      gridLine: 'rgba(255,255,255,0.06)',
    },
  },
  typography: {
    fontFamily: 'var(--font-heebo), "Heebo", "Inter", "Roboto", "Arial", sans-serif',
    h1: { fontFamily: 'var(--font-varela-round), "Varela Round", "Heebo", sans-serif', fontWeight: 400, fontSize: '2.5rem' },
    h2: { fontFamily: 'var(--font-varela-round), "Varela Round", "Heebo", sans-serif', fontWeight: 400, fontSize: '2rem' },
    h3: { fontFamily: 'var(--font-varela-round), "Varela Round", "Heebo", sans-serif', fontWeight: 400, fontSize: '1.75rem' },
    h4: { fontFamily: 'var(--font-varela-round), "Varela Round", "Heebo", sans-serif', fontWeight: 400, fontSize: '1.5rem' },
    h5: { fontWeight: 500, fontSize: '1.25rem' },
    h6: { fontWeight: 500, fontSize: '1rem' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {

    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: 'var(--font-heebo), "Heebo", "Inter", "Roboto", "Arial", sans-serif',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          transition:
            'background-color 0.35s ease, color 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'medium',
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          right: 14,
          transformOrigin: 'top left',
        },
      },
    },
  },
});

export default theme;
