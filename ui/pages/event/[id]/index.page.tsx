import React, { useEffect, useState } from "react";

import { observer } from "mobx-react-lite";
import Head from "next/head";
import { Box, Button, Link, Paper, styled, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { utils } from "near-api-js";
import NextLink from "next/link";

import { useRootStore } from "providers/RootStoreContext";
import withAuth from "hocs/withAuth";
import Layout from "components/Layout";
import { NextPageWithLayout } from "pages/_app.page";
import MessageCard from "components/MessageCard";
import SkeletonWrapper from "components/SkeletonWrapper";
import { EventStatus } from "types";

const Item = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
}));

const EventPage = (): JSX.Element => {
  const router = useRouter();
  const { authStore, eventStore } = useRootStore();
  const [isEventLoading, setIsEventLoading] = useState(false);

  const eventId = parseInt(router.query.id as string);

  const event = eventStore.getEvent(eventId);

  useEffect(() => {
    // if event already loaded, or user isn't logged in
    if (event || !authStore.isLoggedIn) return;

    (async () => {
      setIsEventLoading(true);
      await eventStore.loadEvent(eventId);
      await eventStore.loadEventParticipatingStatus(eventId);
      setIsEventLoading(false);
    })();
  }, [authStore.isLoggedIn]);

  if (!authStore.isLoggedIn)
    return (
      <MessageCard
        message="Only authorized users can see their events, please connect your
  wallet"
      />
    );

  if (isEventLoading)
    return <SkeletonWrapper variant="rectangular" wrapOn height={250} />;

  if (!event) return <MessageCard message="Ooops, no such event found ..." />;

  // if event is still under configuration
  if (event.status === EventStatus.Configuration)
    return (
      <Box
        sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        <MessageCard message="This event is still not open for regular users, please wait until owner make it visible for everyone" />
        <NextLink href={`/event/${event.id}/manage`}>
          <Link
            href={`/event/${event.id}/manage`}
            variant="body1"
            sx={{
              display: "inherit",
              marginX: 1,
              padding: 0.5,
            }}
            border={1}
            borderRadius={2}
            underline="always"
          >
            Configure
          </Link>
        </NextLink>
      </Box>
    );

  const participantsToDisplay = eventStore.areYouParticipatingAtEvent(event.id)
    ? event.participants_amount - 1
    : event.participants_amount;

  const handleJoinEvent = async (): Promise<void> => {
    eventStore.joinEvent(event);
  };

  return (
    <>
      <Head>
        <title>Raffle App - {event.title}</title>
      </Head>
      <Typography color="common.white" variant="h3">
        {event.title}
      </Typography>
      {event.status === EventStatus.Visible && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-evenly",
            alignItems: "center",
            marginY: 4,
            marginX: 2,
          }}
        >
          <Box>
            <Typography
              textAlign="center"
              sx={{ paddingTop: 4 }}
              color="primary"
              variant="h5"
            >
              Doors will be opened at
            </Typography>
            <Box
              sx={{
                marginY: 1,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Item>{new Date(event.started_at).toLocaleString()}</Item>
            </Box>
            <Typography
              textAlign="center"
              sx={{ paddingTop: 4 }}
              color="primary"
              variant="h5"
            >
              Prizes
            </Typography>
            <Box sx={{ display: "flex", marginY: 1, justifyContent: "center" }}>
              {event.prizes.map(({ prize_type }, index) => (
                <Item key={`prize-${index}`} sx={{ marginX: 0.5 }}>
                  {utils.format.formatNearAmount(prize_type.amount)}Ⓝ
                </Item>
              ))}
            </Box>
          </Box>
          <MessageCard message="Oh, event hasn't started, relax and come back once it did 😊" />
        </Box>
      )}
      {event.status === EventStatus.Active && (
        <>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-evenly",
              alignItems: "center",
              marginY: 4,
              marginX: 2,
            }}
          >
            <Box>
              <Typography
                textAlign="center"
                sx={{ paddingTop: 4 }}
                color="primary"
                variant="h5"
              >
                Doors will be closed at
              </Typography>
              <Box
                sx={{
                  marginY: 1,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Item>{new Date(event.ended_at).toLocaleString()}</Item>
              </Box>
              <Typography
                textAlign="center"
                sx={{ paddingTop: 4 }}
                color="primary"
                variant="h5"
              >
                Prizes
              </Typography>
              <Box
                sx={{ display: "flex", marginY: 1, justifyContent: "center" }}
              >
                {event.prizes.map(({ prize_type }, index) => (
                  <Item key={`prize-${index}`} sx={{ marginX: 0.5 }}>
                    {utils.format.formatNearAmount(prize_type.amount)}Ⓝ
                  </Item>
                ))}
              </Box>
              {participantsToDisplay >= 2 && (
                <Box
                  sx={{
                    paddingTop: 4,
                    display: "flex",
                    marginY: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {eventStore.areYouParticipatingAtEvent(event.id) && (
                    <Typography
                      textAlign="center"
                      sx={{ marginRight: 1 }}
                      color="primary"
                      variant="h5"
                    >
                      You and
                    </Typography>
                  )}
                  <Item>{participantsToDisplay}</Item>
                  <Typography
                    textAlign="center"
                    sx={{ marginLeft: 1 }}
                    color="primary"
                    variant="h5"
                  >
                    people are already participating
                  </Typography>
                </Box>
              )}
            </Box>
            {eventStore.areYouParticipatingAtEvent(event.id) && (
              <MessageCard message="You're already participating, please wait until it ends and owner raffles prizes 😇" />
            )}
            {!eventStore.areYouParticipatingAtEvent(event.id) &&
              !eventStore.areYouOwnerOfEvent(event.id) && (
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleJoinEvent}
                >
                  Participate
                </Button>
              )}
            {eventStore.areYouOwnerOfEvent(event.id) && (
              <MessageCard message="Owner couldn't participate in his own events ⚠️" />
            )}
          </Box>
        </>
      )}
      {event.status === EventStatus.Raffling && (
        <>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-evenly",
              alignItems: "center",
              marginY: 4,
              marginX: 2,
            }}
          >
            <Box>
              <Typography
                textAlign="center"
                sx={{ paddingTop: 4 }}
                color="primary"
                variant="h5"
              >
                Doors already closed
              </Typography>
              <Typography
                textAlign="center"
                sx={{ paddingTop: 4 }}
                color="primary"
                variant="h5"
              >
                Prizes
              </Typography>
              <Box
                sx={{ display: "flex", marginY: 1, justifyContent: "center" }}
              >
                {event.prizes.map(({ prize_type }, index) => (
                  <Item key={`prize-${index}`} sx={{ marginX: 0.5 }}>
                    {utils.format.formatNearAmount(prize_type.amount)}Ⓝ
                  </Item>
                ))}
              </Box>
              {participantsToDisplay >= 2 && (
                <Box
                  sx={{
                    paddingTop: 4,
                    display: "flex",
                    marginY: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {eventStore.areYouParticipatingAtEvent(event.id) && (
                    <Typography
                      textAlign="center"
                      sx={{ marginRight: 1 }}
                      color="primary"
                      variant="h5"
                    >
                      You and
                    </Typography>
                  )}
                  <Item>{participantsToDisplay}</Item>
                  <Typography
                    textAlign="center"
                    sx={{ marginLeft: 1 }}
                    color="primary"
                    variant="h5"
                  >
                    people were joined
                  </Typography>
                </Box>
              )}
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <MessageCard message="The event has ended, wait until owner raffles prizes 🏆" />
              {eventStore.areYouOwnerOfEvent(event.id) && (
                <NextLink href={`/event/${event.id}/manage`}>
                  <Link
                    href={`/event/${event.id}/manage`}
                    variant="body1"
                    sx={{
                      display: "inherit",
                      marginX: 1,
                      padding: 0.5,
                    }}
                    border={1}
                    borderRadius={2}
                    underline="always"
                  >
                    Raffle prizes
                  </Link>
                </NextLink>
              )}
            </Box>
          </Box>
        </>
      )}
      {event.status === EventStatus.Claiming && (
        <>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-evenly",
              alignItems: "center",
              marginY: 4,
              marginX: 2,
            }}
          >
            <Box>
              <Typography
                textAlign="center"
                sx={{ paddingTop: 4 }}
                color="primary"
                variant="h5"
              >
                Time to claim rewards 🥇
              </Typography>
              {participantsToDisplay >= 2 && (
                <Box
                  sx={{
                    paddingTop: 4,
                    display: "flex",
                    marginY: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {eventStore.areYouParticipatingAtEvent(event.id) && (
                    <Typography
                      textAlign="center"
                      sx={{ marginRight: 1 }}
                      color="primary"
                      variant="h5"
                    >
                      You and
                    </Typography>
                  )}
                  <Item>{participantsToDisplay}</Item>
                  <Typography
                    textAlign="center"
                    sx={{ marginLeft: 1 }}
                    color="primary"
                    variant="h5"
                  >
                    people were joined
                  </Typography>
                </Box>
              )}
              <Typography
                textAlign="center"
                sx={{ paddingTop: 4 }}
                color="primary"
                variant="h5"
              >
                Winners
              </Typography>
              <Box
                sx={{ display: "flex", marginY: 1, justifyContent: "center" }}
              >
                {event.prizes.map(
                  ({ prize_type, winner_account_id }, index) => (
                    <Item key={`prize-${index}`} sx={{ marginX: 0.5 }}>
                      {winner_account_id} (
                      {utils.format.formatNearAmount(prize_type.amount)}Ⓝ)
                    </Item>
                  )
                )}
              </Box>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <MessageCard message="The event is over, don't forget to claim rewards 🎰" />
              <NextLink href={`/rewards`}>
                <Link
                  href={`/rewards`}
                  variant="body1"
                  sx={{
                    display: "inherit",
                    marginX: 1,
                    padding: 0.5,
                  }}
                  border={1}
                  borderRadius={2}
                  underline="always"
                >
                  Claim rewards
                </Link>
              </NextLink>
            </Box>
          </Box>
        </>
      )}
    </>
  );
};

const ObservedEventPage = observer(EventPage);

const WrappedPage: NextPageWithLayout = observer(withAuth(ObservedEventPage));

WrappedPage.getLayout = (page) => {
  return <Layout>{page}</Layout>;
};

export default WrappedPage;
