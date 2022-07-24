import { ThemeProvider } from "@emotion/react";
import { FC } from "react";
import theme from "theme";

const AppThemeProvider: FC = ({ children }) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

export default AppThemeProvider;
