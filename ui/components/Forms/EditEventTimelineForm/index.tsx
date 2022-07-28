import {
  Button,
  Card,
  CardContent,
  CardHeader,
  FormGroup,
  TextField,
  Typography,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers";
import { EventEntity } from "entities/EventEntity";
import { observer } from "mobx-react-lite";
import { useRootStore } from "providers/RootStoreContext";

type EditEventTimelineFormProps = {
  event: EventEntity;
};

const EditEventTimelineForm = ({
  event,
}: EditEventTimelineFormProps): JSX.Element => {
  const { formStore } = useRootStore();

  const { editEventTimeline } = formStore;

  const handleEditEventTimeline = async (): Promise<void> => {
    editEventTimeline.highlightErrorFields();

    await editEventTimeline.submit(event.id);
  };

  return (
    <Card
      variant="outlined"
      sx={{
        marginX: 1,
      }}
    >
      <CardHeader component={Typography} subheader="Edit your event timeline" />
      <CardContent>
        <FormGroup>
          <DateTimePicker
            label={editEventTimeline.getField("started_at").label}
            value={editEventTimeline.getField("started_at").value}
            inputFormat="D/MM/YYYY HH:mm"
            disablePast
            ampm={false}
            onChange={(v) => {
              editEventTimeline.setField("started_at", v.unix() * 1000);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                error={!editEventTimeline.getField("started_at").isValid}
                helperText={editEventTimeline.getField("started_at").errorText}
                margin="dense"
                variant="standard"
                focused
              />
            )}
          />
          <DateTimePicker
            label={editEventTimeline.getField("ended_at").label}
            value={editEventTimeline.getField("ended_at").value}
            inputFormat="D/MM/YYYY HH:mm"
            disablePast
            ampm={false}
            onChange={(v) => {
              editEventTimeline.setField("ended_at", v.unix() * 1000);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                error={!editEventTimeline.getField("ended_at").isValid}
                helperText={editEventTimeline.getField("ended_at").errorText}
                margin="dense"
                variant="standard"
                focused
              />
            )}
          />
          <Button
            disabled={
              !editEventTimeline.isValidFormValues ||
              editEventTimeline.submitting
            }
            color="primary"
            variant="contained"
            onClick={handleEditEventTimeline}
            sx={{
              marginTop: 2,
            }}
          >
            Save time
          </Button>
        </FormGroup>
      </CardContent>
    </Card>
  );
};

export default observer(EditEventTimelineForm);
