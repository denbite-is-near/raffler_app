import React, { useState } from "react";

import { observer } from "mobx-react-lite";
import { Box, Button, Paper, styled, Typography } from "@mui/material";
import Head from "next/head";
import { utils } from "near-api-js";
import { useSnackbar } from "notistack";

import { useRootStore } from "providers/RootStoreContext";
import withAuth from "hocs/withAuth";
import Layout from "components/Layout";
import SkeletonWrapper from "components/SkeletonWrapper";
import MessageCard from "components/MessageCard";
import { EventId, EventPrize } from "types";

import { NextPageWithLayout } from "./_app.page";

const Item = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
}));

const Page = (): JSX.Element => {
  const [areRewardsLoading, setRewardsLoading] = useState(false);
  const [isClaiming, setClaiming] = useState(false);
  const { authStore, eventStore, rewardStore } = useRootStore();
  const { enqueueSnackbar } = useSnackbar();

  const rewards = rewardStore.myUnclaimedRewardsArray;

  React.useEffect(() => {
    if (!authStore.isLoggedIn) return;

    (async () => {
      setRewardsLoading(true);
      await rewardStore.loadAccountUnclaimedRewards();
      setRewardsLoading(false);
    })();
  }, [authStore.isLoggedIn]);

  if (!authStore.isLoggedIn)
    return (
      <MessageCard
        message="Only authorized users can see their events, please connect your
  wallet"
      />
    );

  if (areRewardsLoading)
    return <SkeletonWrapper variant="rectangular" wrapOn height={250} />;

  if (rewards.length === 0)
    return (
      <MessageCard message="Ooops, you don't have unclaimed rewards ..." />
    );

  const getEventTitle = (id: EventId): string => {
    const event = eventStore.getEvent(id);

    if (!event)
      throw new Error(`Couldn't get from store event with id '${id}'`);

    return event.title;
  };

  const getEventPrizeAmount = (reward: EventPrize): string => {
    const event = eventStore.getEvent(reward.event_id);

    if (!event)
      throw new Error(
        `Couldn't get event from store with id '${reward.event_id}'`
      );

    const prize = event.prizes[reward.prize_index];

    if (!prize)
      throw new Error(
        `Couldn't get prize from store with id '${reward.event_id}' & index '${reward.prize_index}'`
      );

    return prize.prize_type.amount;
  };

  const claimReward = async (reward: EventPrize): Promise<void> => {
    try {
      setClaiming(true);

      await rewardStore.claimReward(reward);

      enqueueSnackbar(`Reward was successfully claimed 🤝`, {
        variant: "success",
      });

      // get new balance
      await authStore.updateAuthAccount();
    } catch {
      enqueueSnackbar(`Something went wrong during claiming your reward 😢`, {
        variant: "error",
      });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <>
      <Head>
        <title>Raffle App - rewards</title>
      </Head>
      <Typography color="common.white" variant="h3">
        Your unclaimed rewards
      </Typography>

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
          {rewards.map((r) => (
            <Box
              key={`reward-${r.event_id}:${r.prize_index}`}
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginY: 2,
              }}
            >
              <Typography textAlign="center" color="primary" variant="h5">
                {getEventTitle(r.event_id)}
              </Typography>
              <Item sx={{ marginX: 1.25 }}>
                {utils.format.formatNearAmount(getEventPrizeAmount(r)) + "Ⓝ"}
              </Item>
              <Button
                disabled={isClaiming}
                variant="outlined"
                size="small"
                onClick={() => claimReward(r)}
              >
                Claim
              </Button>
            </Box>
          ))}
        </Box>
      </Box>
    </>
  );
};

const ObservedPage = observer(Page);

const WrappedPage: NextPageWithLayout = observer(withAuth(ObservedPage));

WrappedPage.getLayout = (page) => {
  return <Layout>{page}</Layout>;
};

export default WrappedPage;
