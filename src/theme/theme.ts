'use client';
import { createTheme } from '@mui/material/styles';

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
  },
  typography: {
    fontFamily: '"Inter", "Heebo", "Roboto", "Arial", sans-serif',
    h1: { fontWeight: 700, fontSize: '2.5rem' },
    h2: { fontWeight: 700, fontSize: '2rem' },
    h3: { fontWeight: 700, fontSize: '1.75rem' },
    h4: { fontWeight: 600, fontSize: '1.5rem' },
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
          fontFamily: '"Inter", "Heebo", "Roboto", "Arial", sans-serif',
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
