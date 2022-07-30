import React, { useState } from "react";

import { observer } from "mobx-react-lite";
import { Box, Card, CardContent, Typography } from "@mui/material";

import { useRootStore } from "providers/RootStoreContext";
import withAuth from "hocs/withAuth";
import Layout from "components/Layout";
import EventList from "components/EventList";
import SkeletonWrapper from "components/SkeletonWrapper";

import { NextPageWithLayout } from "./_app.page";

const HomePage = (): JSX.Element => {
  const [isOwnedEventsLoading, loadOwnedEventsLoading] = useState(false);
  const [isParticipatedEventsLoading, loadParticipatedEventsLoading] =
    useState(false);
  const { authStore, eventStore } = useRootStore();

  React.useEffect(() => {
    if (!authStore.isLoggedIn) return;

    const afterAuthEffect = async (): Promise<void> => {
      loadOwnedEventsLoading(true);
      loadParticipatedEventsLoading(true);

      await eventStore.loadOwnedEvents();
      loadOwnedEventsLoading(false);

      await eventStore.loadParticipatedEvents();
      loadParticipatedEventsLoading(false);
    };

    afterAuthEffect();
  }, [authStore.isLoggedIn]);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 360,
          }}
        >
          <Typography color="common.white" variant="h5" textAlign="center">
            Your created events
          </Typography>

          {!authStore.isLoggedIn && (
            <Card sx={{ marginY: 2 }} variant="outlined">
              <CardContent>
                <Typography textAlign="center">
                  Only authorized users can see their events, please connect
                  your wallet
                </Typography>
              </CardContent>
            </Card>
          )}

          <SkeletonWrapper wrapOn={isOwnedEventsLoading}>
            {authStore.isLoggedIn && (
              <EventList items={eventStore.ownedEvents} showEditButton />
            )}

            {authStore.isLoggedIn && eventStore.ownedEvents.length === 0 && (
              <Card sx={{ marginY: 2 }} variant="outlined">
                <CardContent>
                  <Typography textAlign="center">
                    There&#39;s no events to display
                  </Typography>
                </CardContent>
              </Card>
            )}
          </SkeletonWrapper>
        </Box>
        <Box
          sx={{
            width: "100%",
            maxWidth: 360,
          }}
        >
          <Typography color="common.white" variant="h5" textAlign="center">
            Participated events
          </Typography>

          {!authStore.isLoggedIn && (
            <Card sx={{ marginY: 2 }} variant="outlined">
              <CardContent>
                <Typography textAlign="center">
                  Only authorized users can see events they&#39;re
                  participating, please connect your wallet
                </Typography>
              </CardContent>
            </Card>
          )}

          <SkeletonWrapper wrapOn={isParticipatedEventsLoading}>
            {authStore.isLoggedIn && (
              <EventList items={eventStore.participatedEvents} />
            )}

            {authStore.isLoggedIn &&
              eventStore.participatedEvents.length === 0 && (
                <Card sx={{ marginY: 2 }} variant="outlined">
                  <CardContent>
                    <Typography textAlign="center">
                      There&#39;s no events to display
                    </Typography>
                  </CardContent>
                </Card>
              )}
          </SkeletonWrapper>
        </Box>
      </Box>
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
