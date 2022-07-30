import React from "react";

import type { SkeletonProps } from "@mui/material";
import { Skeleton } from "@mui/material";
import { observer } from "mobx-react-lite";

export type SkeletonWrapperProps = {
  wrapOn: boolean;
} & SkeletonProps;

const SkeletonWrapper: React.FC<SkeletonWrapperProps> = (
  props
): JSX.Element => {
  if (!props.wrapOn) return <>{props.children}</>;

  return (
    <Skeleton
      sx={{ backgroundColor: "#eeffee55" }}
      animation="pulse"
      {...props}
    >
      {props.children}
    </Skeleton>
  );
};

const WrappedSkeletonWrapper = observer(SkeletonWrapper);

export default WrappedSkeletonWrapper;
