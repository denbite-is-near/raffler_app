import React, { useEffect } from "react";

import Head from "next/head";
import { useRouter } from "next/router";

const AuthPage = (): JSX.Element => {
  const router = useRouter();

  useEffect(() => {
    const queryKeysCount = Object.keys(router.query).length;

    if (queryKeysCount === 0) return;

    const { account_id, public_key, all_keys, ...restQuery } = router.query;

    const allFieldsPresent = account_id && public_key && all_keys;

    if (!allFieldsPresent) return;

    router.push({
      pathname: "/",
      query: restQuery,
    });
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

export default AuthPage;
