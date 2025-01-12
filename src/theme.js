import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    fontFamily: '"museo-sans", sans-serif',
    allVariants: {
      fontFamily: '"museo-sans", sans-serif',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: '"museo-sans", sans-serif',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            fontFamily: '"museo-sans", sans-serif',
          },
          '& .MuiInputLabel-root': {
            fontFamily: '"museo-sans", sans-serif',
          },
        },
      },
    },
  },
});

export default theme;