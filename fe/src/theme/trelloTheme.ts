import { createTheme } from '@mui/material/styles';

// Trello-like Design System
export const trelloTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0E50E1', // Blue interactive elements
      dark: '#4179DD',
      contrastText: '#FFFEFF',
    },
    secondary: {
      main: '#743254', // Purple/magenta accent
      dark: '#632243',
      light: '#A16081',
    },
    error: {
      main: '#CC1D08', // Red alert/danger
      light: '#EF5855',
    },
    warning: {
      main: '#FF9800',
    },
    success: {
      main: '#4CAF50',
    },
    background: {
      default: '#F5F5F5', // Light grey for main board area
      paper: '#1A1D20', // Dark cards
    },
    surface: {
      primary: '#2F3840', // Primary dark background
      secondary: '#272E34', // Secondary dark background
      tertiary: '#242A30', // Sidebar background
      quaternary: '#1A1D20', // Darkest background
      light: '#F5F5F5', // Light background
      white: '#FFFEFF', // Pure white
    },
    text: {
      primary: '#FFFEFF', // White text
      secondary: '#BDC1CA', // Light grey text
      disabled: '#9095A1', // Medium grey text
    },
    divider: '#9095A1',
    action: {
      hover: 'rgba(255, 255, 255, 0.08)',
      selected: 'rgba(255, 255, 255, 0.12)',
      disabled: 'rgba(255, 255, 255, 0.26)',
    },
  },
  typography: {
    fontFamily: '"Catamaran", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '29px',
      fontWeight: 700,
      color: '#FFFEFF',
    },
    h2: {
      fontSize: '24px',
      fontWeight: 700,
      color: '#FFFEFF',
    },
    h3: {
      fontSize: '20px',
      fontWeight: 700,
      color: '#FFFEFF',
    },
    h4: {
      fontSize: '19px',
      fontWeight: 700,
      color: '#FFFEFF',
    },
    h5: {
      fontSize: '16px',
      fontWeight: 700,
      color: '#FFFEFF',
    },
    h6: {
      fontSize: '15px',
      fontWeight: 700,
      color: '#FFFEFF',
    },
    body1: {
      fontSize: '15px',
      fontWeight: 400,
      color: '#BDC1CA',
    },
    body2: {
      fontSize: '13px',
      fontWeight: 400,
      color: '#BDC1CA',
    },
    caption: {
      fontSize: '12px',
      fontWeight: 400,
      color: '#9095A1',
    },
    overline: {
      fontSize: '10px',
      fontWeight: 400,
      color: '#9095A1',
      textTransform: 'uppercase',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F5F5F5',
          fontFamily: '"Catamaran", "Roboto", "Helvetica", "Arial", sans-serif',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1A1D20',
          border: '1px solid #9095A1',
          borderRadius: '2px',
          '&:hover': {
            borderColor: '#BDC1CA',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '2px',
          textTransform: 'none',
          fontWeight: 600,
          fontFamily: '"Catamaran", "Roboto", "Helvetica", "Arial", sans-serif',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        outlined: {
          borderColor: '#9095A1',
          color: '#BDC1CA',
          '&:hover': {
            borderColor: '#BDC1CA',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
        },
      },
      variants: [
        {
          props: { variant: 'danger' },
          style: {
            backgroundColor: '#EF5855',
            color: '#1A1D20',
            '&:hover': {
              backgroundColor: '#CC1D08',
            },
          },
        },
        {
          props: { variant: 'accent' },
          style: {
            backgroundColor: '#A16081',
            color: '#FFFEFF',
            '&:hover': {
              backgroundColor: '#743254',
            },
          },
        },
      ],
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#2F3840',
            '& fieldset': {
              borderColor: '#565D6D',
            },
            '&:hover fieldset': {
              borderColor: '#9095A1',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#0E50E1',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#9095A1',
          },
          '& .MuiOutlinedInput-input': {
            color: '#FFFEFF',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#2F3840',
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#743254',
          boxShadow: 'none',
          height: '50px',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#242A30',
          width: '228px',
          border: 'none',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          width: '26px',
          height: '24px',
          fontSize: '12px',
          fontWeight: 700,
          border: '1px solid #9095A1',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: '#2F3840',
          color: '#BDC1CA',
          border: '1px solid #9095A1',
          '&:hover': {
            backgroundColor: '#565D6D',
          },
        },
      },
    },
  },
  shape: {
    borderRadius: 2,
  },
  spacing: 8,
});

// Extend theme to include custom colors
declare module '@mui/material/styles' {
  interface Palette {
    surface: {
      primary: string;
      secondary: string;
      tertiary: string;
      quaternary: string;
      light: string;
      white: string;
    };
  }

  interface PaletteOptions {
    surface?: {
      primary?: string;
      secondary?: string;
      tertiary?: string;
      quaternary?: string;
      light?: string;
      white?: string;
    };
  }
}

// Button variants
declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    danger: true;
    accent: true;
  }
}

export default trelloTheme;
