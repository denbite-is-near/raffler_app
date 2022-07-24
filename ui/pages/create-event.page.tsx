import React, { useEffect } from "react";

import { observer } from "mobx-react-lite";
import Head from "next/head";

import { NextPageWithLayout } from "./_app.page";
import ConnectWalletButton from "components/Buttons/ConnectWalletButton";
import { useRootStore } from "providers/RootStoreContext";
import withAuth from "hocs/withAuth";
import NextLink from "next/link";
import { Box, Button, FormGroup, Link, TextField } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers";

const CreateEventPage = (): JSX.Element => {
  const { authStore, eventStore, formStore } = useRootStore();

  const { createEvent } = formStore;

  const handleSubmit = async (): Promise<void> => {
    createEvent.highlightErrorFields();

    try {
      await createEvent.submit();
    } catch {}
  };

  return (
    <>
      <Head>
        <title>Raffle App - create event</title>
      </Head>
      <NextLink href="/">
        <Link variant="body2">Home</Link>
      </NextLink>

      {!authStore.isLoggedIn && <ConnectWalletButton />}
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
      {authStore.isLoggedIn && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            margin: 4,
          }}
        >
          <FormGroup>
            <TextField
              name="event_name"
              required={createEvent.getField("title").required}
              placeholder="Your title here"
              label={createEvent.getField("title").label}
              value={createEvent.getField("title").value}
              onChange={(e) => {
                createEvent.setField("title", e.target.value);
              }}
              error={!createEvent.getField("title").isValid}
              helperText={createEvent.getField("title").errorText}
              focused
              margin="dense"
              variant="standard"
            />
            <DateTimePicker
              label={createEvent.getField("started_at").label}
              value={createEvent.getField("started_at").value}
              inputFormat="D/MM/YYYY HH:mm"
              disablePast
              disableMaskedInput
              onChange={(v) => {
                createEvent.setField("started_at", v.unix() * 1_000);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  error={!createEvent.getField("started_at").isValid}
                  helperText={createEvent.getField("started_at").errorText}
                  margin="dense"
                />
              )}
            />
            <DateTimePicker
              label={createEvent.getField("ended_at").label}
              value={createEvent.getField("ended_at").value}
              inputFormat="D/MM/YYYY HH:mm"
              disablePast
              disableMaskedInput
              onChange={(v) => {
                createEvent.setField("ended_at", v.unix() * 1_000);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  error={!createEvent.getField("ended_at").isValid}
                  helperText={createEvent.getField("ended_at").errorText}
                  margin="dense"
                />
              )}
            />
            <Button
              disabled={!createEvent.isValidFormValues}
              color="primary"
              variant="contained"
              onClick={handleSubmit}
            >
              Create
            </Button>
          </FormGroup>
        </Box>
      )}
    </>
  );
};

const ObservedCreateEventPage = observer(CreateEventPage);

const WrappedPage: NextPageWithLayout = observer(
  withAuth(ObservedCreateEventPage)
);

export default WrappedPage;
