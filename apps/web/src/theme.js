import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0057b8'
    },
    secondary: {
      main: '#f05a28'
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: '"Source Sans 3", "Segoe UI", sans-serif'
  },
  shape: {
    borderRadius: 10
  }
});
