import React, { useEffect } from "react";

import { observer } from "mobx-react-lite";
import Head from "next/head";

import { useRootStore } from "providers/RootStoreContext";
import withAuth from "hocs/withAuth";
import Layout from "components/Layout";
import { NextPageWithLayout } from "pages/_app.page";
import { useRouter } from "next/router";
import { useState } from "react";
import SkeletonWrapper from "components/SkeletonWrapper";
import { Box, Button, Paper, Stack, styled, Typography } from "@mui/material";
import { EventStatus } from "types";
import { utils } from "near-api-js";
import MessageCard from "components/MessageCard";
import EditEventTimelineForm from "components/Forms/EditEventTimelineForm";
import AddEventPrizeForm from "components/Forms/AddEventPrizeForm";

const Item = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
}));

const ManageEventPage = (): JSX.Element => {
  const router = useRouter();
  const { authStore, eventStore, formStore } = useRootStore();
  const [isEventLoading, setIsEventLoading] = useState(false);

  const eventId = parseInt(router.query.id as string);

  const event = eventStore.getEvent(eventId);

  useEffect(() => {
    // if event already loaded, or user isn't logged in
    if (event || !authStore.isLoggedIn) return;

    (async () => {
      setIsEventLoading(true);
      await eventStore.loadEvent(eventId);
      setIsEventLoading(false);
    })();
  }, [authStore.isLoggedIn]);

  if (isEventLoading)
    return <SkeletonWrapper variant="rectangular" wrapOn height={250} />;

  if (!authStore.isLoggedIn)
    return (
      <MessageCard
        message="Only authorized users can see their events, please connect your
    wallet"
      />
    );

  if (!event) return <MessageCard message="Ooops, no such event found ..." />;
  if (!eventStore.areYouOwnerOfEvent(event.id))
    return (
      <MessageCard message="Only this event owner could access the page" />
    );

  const areWinnersKnown = event.status === EventStatus.Claiming;
  const { editEventTimeline, addEventPrize } = formStore;

  const handleSetEventVisible = async (): Promise<void> => {
    await eventStore.setEventVisible(event.id);
  };

  const handleRafflePrizes = async (): Promise<void> => {
    await eventStore.raffleEventPrizes(event.id, event.prizes.length);
  };

  return (
    <>
      <Head>
        <title>Raffle App - manage event #{event.id}</title>
      </Head>
      <Typography variant="h3">Edit "{event.title}"</Typography>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-around",
          marginY: 4,
          marginX: 2,
        }}
      >
        <Stack spacing={1} maxWidth={450}>
          <Item>
            Start date = {new Date(event.started_at).toLocaleString()}
          </Item>
          <Item>End date = {new Date(event.ended_at).toLocaleString()}</Item>
          <Item>Status = {event.status}</Item>
          <Item>Participants = {event.participants_amount}</Item>
          {areWinnersKnown && (
            <Item>
              Winners ={" "}
              {event.prizes
                .filter((prize) => Boolean(prize.winner_account_id))
                .map(
                  (prize) =>
                    `${prize.winner_account_id}(${utils.format.formatNearAmount(
                      prize.prize_type.amount,
                      3
                    )}N)`
                )
                .join(" | ")}
            </Item>
          )}
          {!areWinnersKnown && (
            <Item>
              Prizes ={" "}
              {event.prizes
                .map(
                  (prize) =>
                    `${utils.format.formatNearAmount(
                      prize.prize_type.amount,
                      3
                    )}N`
                )
                .join(" | ")}
            </Item>
          )}
        </Stack>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            rowGap: 10,
          }}
        >
          {event.status === EventStatus.Configuration && (
            <>
              <EditEventTimelineForm event={event} />

              <AddEventPrizeForm event={event} />

              {event.prizes.length !== 0 && (
                <Button
                  disabled={
                    editEventTimeline.submitting || addEventPrize.submitting
                  }
                  color="primary"
                  variant="outlined"
                  onClick={handleSetEventVisible}
                  sx={{
                    marginX: 1,
                  }}
                >
                  Set visible
                </Button>
              )}
            </>
          )}

          {event.status === EventStatus.Visible && (
            <MessageCard message="Waiting for event to start" />
          )}
          {event.status === EventStatus.Active && (
            <MessageCard message="Waiting for users to join" />
          )}
          {event.status === EventStatus.Raffling && (
            <>
              <Button
                color="primary"
                variant="contained"
                onClick={handleRafflePrizes}
                sx={{}}
              >
                Raffle prizes
              </Button>
            </>
          )}
          {event.status === EventStatus.Claiming && (
            <MessageCard message="Prizes are available to claim by winners" />
          )}
        </Box>
      </Box>
    </>
  );
};

const ObservedManageEventPage = observer(ManageEventPage);

const WrappedPage: NextPageWithLayout = observer(
  withAuth(ObservedManageEventPage)
);

WrappedPage.getLayout = (page) => {
  return <Layout>{page}</Layout>;
};

export default WrappedPage;
