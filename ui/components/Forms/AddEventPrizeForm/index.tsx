import {
  Button,
  Card,
  CardContent,
  CardHeader,
  FormGroup,
  TextField,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";

import { EventEntity } from "entities/EventEntity";
import { useRootStore } from "providers/RootStoreContext";

type AddEventPrizeFormProps = {
  event: EventEntity;
};

const AddEventPrizeForm = ({ event }: AddEventPrizeFormProps): JSX.Element => {
  const { formStore } = useRootStore();

  const { addEventPrize } = formStore;

  const handleAddEventPrize = async (): Promise<void> => {
    addEventPrize.highlightErrorFields();

    await addEventPrize.submit(event);
  };

  return (
    <Card
      variant="outlined"
      sx={{
        marginX: 1,
      }}
    >
      <CardHeader component={Typography} subheader="Add you prize" />
      <CardContent>
        <FormGroup>
          <TextField
            name="event_name"
            required={addEventPrize.getField("amount").required}
            label={addEventPrize.getField("amount").label}
            value={addEventPrize.getField("amount").value}
            onChange={(e) => {
              addEventPrize.setField("amount", e.target.value);
            }}
            error={!addEventPrize.getField("amount").isValid}
            helperText={addEventPrize.getField("amount").errorText}
            margin="dense"
            variant="standard"
            focused
          />
          <Button
            disabled={
              !addEventPrize.isValidFormValues || addEventPrize.submitting
            }
            color="primary"
            variant="contained"
            onClick={handleAddEventPrize}
            sx={{
              marginTop: 2,
            }}
          >
            Add near prize
          </Button>
        </FormGroup>
      </CardContent>
    </Card>
  );
};

export default observer(AddEventPrizeForm);
