'use client';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  direction: 'rtl',
  palette: {
    primary: {
      main: '#1a4fdb',
      light: '#4a7aff',
      dark: '#1a3380',
    },
    secondary: {
      main: '#00c7a3',
      light: '#33d4b5',
      dark: '#009e82',
    },
    background: {
      default: '#fafafa',
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
