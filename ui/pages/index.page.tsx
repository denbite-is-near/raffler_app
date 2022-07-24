import React, { useEffect } from "react";

import { observer } from "mobx-react-lite";
import Head from "next/head";

import { NextPageWithLayout } from "./_app.page";
import ConnectWalletButton from "components/Buttons/ConnectWalletButton";
import { useRootStore } from "providers/RootStoreContext";
import withAuth from "hocs/withAuth";
import NextLink from "next/link";
import { Link } from "@mui/material";

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
      <Head>
        <title>Raffle App</title>
      </Head>
      {!authStore.isLoggedIn && <ConnectWalletButton />}
      {authStore.isLoggedIn && (
        <NextLink href="/create-event">
          <Link variant="body2">Create own event</Link>
        </NextLink>
      )}
      {authStore.isLoggedIn && (
        <button
          onClick={() => {
            authStore.logout();
            eventStore.reset();
          }}
        >
          Logout
        </button>
      )}
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

export default WrappedHomePage;
