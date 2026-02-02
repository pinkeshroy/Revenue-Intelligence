import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1e3a5f', // Dark blue
      light: '#2d4a6f',
      dark: '#0f2a4f',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#f5a623', // Orange accent
      light: '#f7b84d',
      dark: '#d4891e',
      contrastText: '#000000'
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c'
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f'
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00'
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff'
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#666666'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 600
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 600
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5
    }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          borderRadius: 12
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600
        }
      }
    }
  }
});

export default theme;
