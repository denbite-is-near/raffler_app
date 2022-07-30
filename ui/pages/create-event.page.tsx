import React from "react";

import { observer } from "mobx-react-lite";
import Head from "next/head";
import {
  Box,
  Button,
  CardContent,
  FormGroup,
  Card,
  TextField,
  Typography,
  CardHeader,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers";

import { useRootStore } from "providers/RootStoreContext";
import withAuth from "hocs/withAuth";
import Layout from "components/Layout";

import { NextPageWithLayout } from "./_app.page";

const CreateEventPage = (): JSX.Element => {
  const { authStore, formStore } = useRootStore();

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

      {!authStore.isLoggedIn && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Card variant="outlined">
            <CardContent>
              <Typography>
                Only authorized users can create events, please connect your
                wallet
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}
      {authStore.isLoggedIn && (
        <Box
          sx={{
            display: "flex",
            flexGrow: 2,
            justifyContent: "center",
            alignItems: "center",
            margin: 4,
          }}
        >
          <Card variant="outlined">
            <CardHeader
              component={Typography}
              title="Create your own event"
              subheader="This is quite easy"
            />
            <CardContent>
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
                  margin="dense"
                  variant="standard"
                  focused
                />
                <DateTimePicker
                  label={createEvent.getField("started_at").label}
                  value={createEvent.getField("started_at").value}
                  inputFormat="D/MM/YYYY HH:mm"
                  disablePast
                  ampm={false}
                  onChange={(v) => {
                    createEvent.setField("started_at", v.unix() * 1_000);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      error={!createEvent.getField("started_at").isValid}
                      helperText={createEvent.getField("started_at").errorText}
                      margin="dense"
                      variant="standard"
                      focused
                    />
                  )}
                />
                <DateTimePicker
                  label={createEvent.getField("ended_at").label}
                  value={createEvent.getField("ended_at").value}
                  inputFormat="D/MM/YYYY HH:mm"
                  disablePast
                  ampm={false}
                  onChange={(v) => {
                    createEvent.setField("ended_at", v.unix() * 1_000);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      error={!createEvent.getField("ended_at").isValid}
                      helperText={createEvent.getField("ended_at").errorText}
                      margin="dense"
                      variant="standard"
                      focused
                    />
                  )}
                />
                <Button
                  disabled={!createEvent.isValidFormValues}
                  color="primary"
                  variant="contained"
                  onClick={handleSubmit}
                  sx={{
                    marginTop: 2,
                  }}
                >
                  Create
                </Button>
              </FormGroup>
            </CardContent>
          </Card>
        </Box>
      )}
    </>
  );
};

const ObservedCreateEventPage = observer(CreateEventPage);

const WrappedPage: NextPageWithLayout = observer(
  withAuth(ObservedCreateEventPage)
);

WrappedPage.getLayout = (page) => {
  return <Layout>{page}</Layout>;
};

export default WrappedPage;
