import "reflect-metadata";

import "@fontsource/cairo";
import "@fontsource/cairo/600.css";
import "styles/globals.css";

import React, { ReactElement, ReactNode } from "react";

import type { AppProps } from "next/app";
import { NextPage } from "next";
import { enableStaticRendering } from "mobx-react-lite";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { SnackbarProvider } from "notistack";

import AppThemeProvider from "providers/AppThemeProvider";
import { RootStoreProvider } from "providers/RootStoreContext";

export type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

if (typeof window === "undefined") {
  /**
   * @see https://github.com/mobxjs/mobx-react#server-side-rendering-with-enablestaticrendering
   */
  enableStaticRendering(true);
}

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  if (true) {
    console.log(`Build date: ${Date.now()}`);
  }

  const getLayout = Component.getLayout ?? ((page) => page);
  const getProviders = (page: JSX.Element) => {
    return (
      <RootStoreProvider>
        <AppThemeProvider>
          <SnackbarProvider maxSnack={3} autoHideDuration={6000}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              {/* <FaviconHead /> */}
              {getLayout(page)}
            </LocalizationProvider>
          </SnackbarProvider>
        </AppThemeProvider>
      </RootStoreProvider>
    );
  };

  return getProviders(<Component {...pageProps} />);
}

export default MyApp;
