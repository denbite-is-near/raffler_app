import { createTheme } from "@mui/material";

declare module "@mui/material/styles" {
  interface BreakpointOverrides {
    xs: false;
    sm: false;
    md: false;
    lg: false;
    xl: false;
    mobile: true;
    tablet: true;
    laptop: true;
    desktop: true;
  }
}

const theme = createTheme({
  breakpoints: {
    values: {
      mobile: 512,
      tablet: 768,
      laptop: 1024,
      desktop: 1200,
    },
  },
  typography: {
    fontFamily: ["Cairo", "sans-serif"].join(","),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: "1rem",
          fontWeight: 400,
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          padding: 0,
          fontSize: "1rem",
          fontWeight: 400,
          ":disabled": {
            opacity: 0.5,
            backgroundColor: "grey !important",
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          padding: 0,
          fontSize: "1rem",
          fontWeight: 400,
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          padding: 0,
        },
      },
    },
  },
  palette: {
    common: {
      black: "#050505",
      white: "#fcfcfc",
    },
    primary: {
      main: "#ffd700",
    },
    secondary: {
      main: "#0057b8",
    },
  },
});

export default theme;
