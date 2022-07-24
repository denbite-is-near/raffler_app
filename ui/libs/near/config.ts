import * as nearAPI from "near-api-js";

export const getNearConfig = (env: string): nearAPI.ConnectConfig => {
  const keyStore = new nearAPI.keyStores.BrowserLocalStorageKeyStore();

  switch (env) {
    case "production":
    case "mainnet":
      return {
        networkId: "mainnet",
        nodeUrl: "https://rpc.mainnet.near.org",
        walletUrl: "https://wallet.near.org",
        helperUrl: "https://helper.mainnet.near.org",
        keyStore,
        headers: {},
      };
    case "development":
    case "testnet":
      return {
        networkId: "testnet",
        nodeUrl: "https://rpc.testnet.near.org",
        walletUrl: "https://wallet.testnet.near.org",
        helperUrl: "https://helper.testnet.near.org",
        keyStore,
        headers: {},
      };
    default:
      throw new Error(`Invalid env given - ${env}`);
  }
};
