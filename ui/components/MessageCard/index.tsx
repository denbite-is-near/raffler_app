import { Box, Card, CardContent, Typography } from "@mui/material";

type MessageCardProps = {
  message: string;
};

const MessageCard = (props: MessageCardProps): JSX.Element => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Card sx={{ marginY: 2 }} variant="outlined">
        <CardContent>
          <Typography textAlign="center">{props.message}</Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MessageCard;
