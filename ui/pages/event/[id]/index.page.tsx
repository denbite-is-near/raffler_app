import React, { useEffect } from "react";

import { observer } from "mobx-react-lite";
import Head from "next/head";

import { useRootStore } from "providers/RootStoreContext";
import withAuth from "hocs/withAuth";
import Layout from "components/Layout";
import { NextPageWithLayout } from "pages/_app.page";
import { Typography } from "@mui/material";

const EventPage = (): JSX.Element => {
  const { authStore, eventStore, formStore } = useRootStore();

  const { createEvent } = formStore;

  return (
    <>
      <Head>
        <title>Raffle App - create event</title>
      </Head>
      <Typography>Event Page</Typography>
    </>
  );
};

const ObservedEventPage = observer(EventPage);

const WrappedPage: NextPageWithLayout = observer(withAuth(ObservedEventPage));

WrappedPage.getLayout = (page) => {
  return <Layout>{page}</Layout>;
};

export default WrappedPage;
