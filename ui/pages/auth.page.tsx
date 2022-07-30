import React, { useEffect } from "react";

import Head from "next/head";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";

import { useRootStore } from "providers/RootStoreContext";

const Page = (): JSX.Element => {
  const router = useRouter();
  const { authStore } = useRootStore();

  useEffect(() => {
    const queryKeysCount = Object.keys(router.query).length;

    if (queryKeysCount === 0) return;

    const { account_id, public_key, all_keys, ...restQuery } = router.query;

    const allFieldsPresent = account_id && public_key && all_keys;

    if (!allFieldsPresent) return;

    (async () => {
      await authStore.updateAuthAccount();

      await router.push({
        pathname: "/",
        query: restQuery,
      });
    })();
  }, [router.query]);

  return (
    <>
      <Head>
        <title>Raffle App</title>
      </Head>
      <div>Authentication ...</div>
    </>
  );
};

const ObservedPage = observer(Page);

export default ObservedPage;
