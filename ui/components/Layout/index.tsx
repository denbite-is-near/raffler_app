import { Box, Link } from "@mui/material";
import { observer } from "mobx-react-lite";
import NextLink from "next/link";
import { useRouter } from "next/router";

import AccountMenuButton from "components/Buttons/AccountMenuButton";
import ConnectWalletButton from "components/Buttons/ConnectWalletButton";
import SkeletonWrapper from "components/SkeletonWrapper";
import { useRootStore } from "providers/RootStoreContext";

const Layout: React.FC = (props): JSX.Element => {
  const router = useRouter();
  const { authStore } = useRootStore();

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          paddingY: 1,
          paddingX: 2,
          justifyContent: "space-between",
        }}
        borderBottom={1}
      >
        <Box display="flex">
          <NextLink href={"/"}>
            <Link
              href="/"
              variant="body1"
              sx={{
                display: "inherit",
                marginX: 1,
                padding: 0.5,
              }}
              border={router.asPath === "/" ? 1 : "none"}
              borderRadius={2}
              underline={router.asPath === "/" ? "none" : "always"}
            >
              Home
            </Link>
          </NextLink>
          <NextLink href="/create-event">
            <Link
              href="/create-event"
              variant="body1"
              sx={{
                display: "inherit",
                marginX: 1,
                padding: 0.5,
              }}
              border={router.asPath === "/create-event" ? 1 : "none"}
              borderRadius={2}
              underline={router.asPath === "/create-event" ? "none" : "always"}
            >
              Create own event
            </Link>
          </NextLink>
          <NextLink href="/rewards">
            <Link
              href="/rewards"
              variant="body1"
              sx={{
                display: "inherit",
                marginX: 1,
                padding: 0.5,
              }}
              border={router.asPath === "/rewards" ? 1 : "none"}
              borderRadius={2}
              underline={router.asPath === "/rewards" ? "none" : "always"}
            >
              Rewards
            </Link>
          </NextLink>
        </Box>
        <Box display="flex">
          <Link
            href={process.env.NEXT_PUBLIC_TWITTER_LINK}
            variant="body1"
            target="_blank"
            sx={{
              display: "inherit",
              marginX: 1,
            }}
            color="common.white"
          >
            Twitter
          </Link>
          <Link
            href={process.env.NEXT_PUBLIC_GITHUB_ISSUE_LINK}
            variant="body1"
            target="_blank"
            sx={{
              display: "inherit",
              marginX: 1,
            }}
            color="common.white"
          >
            Report an issue
          </Link>
        </Box>
        <Box>
          <SkeletonWrapper wrapOn={!authStore.isReady}>
            {!authStore.isLoggedIn && <ConnectWalletButton size="large" />}
            {authStore.isLoggedIn && <AccountMenuButton size="large" />}
          </SkeletonWrapper>
        </Box>
      </Box>
      <Box
        sx={{
          margin: 2,
        }}
      >
        {props.children}
      </Box>
    </>
  );
};

const WrappedLayout = observer(Layout);

export default WrappedLayout;
