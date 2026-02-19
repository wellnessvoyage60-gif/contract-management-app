import { createTheme } from '@mui/material/styles';

const contractProTheme = createTheme({
  palette: {
    primary:   { main: '#0d6efd' },
    secondary: { main: '#6c757d' },
    success:   { main: '#198754' },
    warning:   { main: '#ffc107' },
    error:     { main: '#dc3545' },
    info:      { main: '#0dcaf0' },
    background:{ default: '#f8f9fa' },
  },
  typography: {
    fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
  },
});

export default contractProTheme;
