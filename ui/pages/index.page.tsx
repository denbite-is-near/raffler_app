import React, { useEffect } from "react";

import { observer } from "mobx-react-lite";
import Head from "next/head";

import { NextPageWithLayout } from "./_app.page";
import { useRootStore } from "providers/RootStoreContext";
import withAuth from "hocs/withAuth";
import Layout from "components/Layout";

const HomePage = (): JSX.Element => {
  const { authStore, eventStore } = useRootStore();

  const object = {
    isLoggedIn: authStore.isLoggedIn,
    events: eventStore.allEvents,
    owned: eventStore.ownedEvents,
    participated: eventStore.participatedEvents,
  };

  React.useEffect(() => {
    if (!authStore.isLoggedIn) return;

    const afterAuthEffect = async (): Promise<void> => {
      console.log("load events");

      await eventStore.setOwnedEvents();
      await eventStore.setParticipatedEvents();
    };

    afterAuthEffect();
  }, [authStore.isLoggedIn]);

  return (
    <>
      <div>
        <pre>{JSON.stringify(object, null, 2)}</pre>
      </div>
    </>
  );
};

const ObservedHomePage = observer(HomePage);

const WrappedHomePage: NextPageWithLayout = observer(
  withAuth(ObservedHomePage)
);

WrappedHomePage.getLayout = (page) => {
  return <Layout>{page}</Layout>;
};

export default WrappedHomePage;
