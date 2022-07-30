import { Edit, Language } from "@mui/icons-material";
import { IconButton, List, ListItem, ListItemText } from "@mui/material";
import { useRouter } from "next/router";

import { JsonEvent } from "types";

type EventListProps<T> = {
  items: T[];
  showEditButton?: boolean;
};

const EventList = (props: EventListProps<JsonEvent>) => {
  const router = useRouter();
  const { items, showEditButton = false } = props;

  if (items.length === 0) return <></>;

  const editButtonHandler = async (item: JsonEvent): Promise<void> => {
    const path = `/event/${item.id}/manage`;

    await router.push(path);
  };

  const webButtonHandler = async (item: JsonEvent): Promise<void> => {
    const path = `/event/${item.id}`;

    await router.push(path);
  };

  return (
    <List>
      {items.map((item) => (
        <ListItem
          key={`item-${item.id}`}
          sx={{
            border: "1px solid white",
            borderRadius: 2,
            marginY: 1,
            paddingX: 1,
          }}
        >
          <ListItemText
            primary={item.title}
            secondary={`participants: ${item.participants_amount}`}
            secondaryTypographyProps={{
              color: "primary",
            }}
            primaryTypographyProps={{
              color: "common.white",
            }}
          />
          {showEditButton && editButtonHandler && (
            <IconButton
              sx={{ marginX: 0.5 }}
              color="primary"
              size="large"
              onClick={async () => {
                await editButtonHandler(item);
              }}
            >
              <Edit fontSize="medium" />
            </IconButton>
          )}
          {webButtonHandler && (
            <IconButton
              sx={{ marginX: 0.5 }}
              color="primary"
              size="large"
              onClick={async () => {
                await webButtonHandler(item);
              }}
            >
              <Language fontSize="medium" />
            </IconButton>
          )}
        </ListItem>
      ))}
    </List>
  );
};

export default EventList;
