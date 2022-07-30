import { useMemo } from "react";

import type { BoxProps } from "@mui/material";
import { Box } from "@mui/material";
import { observer } from "mobx-react-lite";

import nearProtocolLogoBlack from "assets/images/near_logo.black.png";
import nearProtocolLogoWhite from "assets/images/near_logo.white.png";

export type NearAmountProps = {
  amount: string;
  mode: "black" | "white";
  boxProps?: BoxProps;
};

const NearAmount = (props: NearAmountProps): JSX.Element => {
  const coloredLogo = useMemo(() => {
    if (props.mode === "black") return nearProtocolLogoBlack;
    if (props.mode === "white") return nearProtocolLogoWhite;

    throw new Error("Invalid mode given");
  }, [props.mode]);

  return (
    <Box display="flex" alignItems="center" {...props.boxProps}>
      <Box marginRight={0.5}>{props.amount}</Box>
      <img src={coloredLogo.src} width={16} height={16} />
      {/* <Image quality={100} src={coloredLogo} width={16} height={16} /> */}
    </Box>
  );
};

const WrappedNearAmount = observer(NearAmount);

export default WrappedNearAmount;
