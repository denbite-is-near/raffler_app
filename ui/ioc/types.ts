import * as nearApi from "near-api-js";

const TYPES = {
  NearManager: "near.manager",
  NearManagerProvider: "near.manager.provider",
  NearService: "near.service",
  WalletService: "wallet.service",
  AccountService: "account.service",
  ContractService: "contract.service",
  AuthStore: "auth.store",
  EventStore: "event.store",
  RewardStore: "reward.store",
  AccountStore: "account.store",
  FormStore: "form.store",
  Contract: "libs.contract",
};

export type NearManagerProvider = () => Promise<nearApi.Near>;

export default TYPES;
