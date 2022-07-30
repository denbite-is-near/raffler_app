import { BN } from "bn.js";
import { AccountEntity } from "entities/AccountEntity";
import { EventEntity } from "entities/EventEntity";
import { inject, injectable } from "inversify";
import TYPES from "ioc/types";
import { makeAutoObservable } from "mobx";
import { computedFn } from "mobx-utils";
import { ContractService } from "services/ContractService";
import WalletService from "services/WalletService";
import { AccountId, AddEvent, EventId, EventPrize, JsonEvent } from "types";
import { AuthStore } from "./AuthStore";
import { EventStore } from "./EventStore";

const STORAGE_PRICE_PER_BYTE = "10000000000000000000"; // 0.0001N

@injectable()
export class RewardStore {
  public unclaimed_rewards: Map<AccountId, EventPrize[]>;

  constructor(
    @inject(TYPES.ContractService) private contractService: ContractService,
    @inject(TYPES.WalletService) private walletService: WalletService,
    @inject(TYPES.AuthStore) private authStore: AuthStore,
    @inject(TYPES.EventStore) private eventStore: EventStore
  ) {
    this.unclaimed_rewards = new Map();

    makeAutoObservable(this, {}, { autoBind: true });
  }

  get myUnclaimedRewardsArray(): EventPrize[] {
    if (!this.authStore.account) return [];

    return this.unclaimed_rewards.get(this.authStore.account.id) || [];
  }

  public addAccountRewards = (
    accountId: AccountId,
    rewards: EventPrize[]
  ): void => {
    const existedRewards = this.unclaimed_rewards.get(accountId) || [];

    const newRewards = [...existedRewards, ...rewards];

    this.unclaimed_rewards.set(accountId, newRewards);
  };

  public removeAccountReward = (
    accountId: AccountId,
    reward: EventPrize
  ): void => {
    const existedRewards = this.unclaimed_rewards.get(accountId) || [];

    // nothing to delete
    if (existedRewards.length === 0) return;

    const index = existedRewards.findIndex((p) => p === reward);

    // haven't found
    if (index === -1) return;

    // delete in place
    existedRewards.splice(index, 1);

    this.unclaimed_rewards.set(accountId, existedRewards);
  };

  public loadAccountUnclaimedRewards = async (): Promise<void> => {
    if (!this.authStore.account) return;

    const account = await this.walletService.getWalletAccount();

    const contract = this.contractService.raffler(account);

    const rewards = await contract.get_account_unclaimed_prizes({
      account_id: this.authStore.account.id,
    });

    const promises = rewards
      .filter((r) => {
        const hasEvent = this.eventStore.events.has(r.event_id);

        return !hasEvent;
      })
      .map((r) => this.eventStore.loadEvent(r.event_id));

    await Promise.all(promises);

    this.addAccountRewards(this.authStore.account.id, rewards);
  };

  public claimReward = async (reward: EventPrize): Promise<void> => {
    if (!this.authStore.account) return;

    const account = await this.walletService.getWalletAccount();

    const contract = this.contractService.raffler(account);

    await contract.claim_prize({
      prize: reward,
    });

    this.removeAccountReward(this.authStore.account.id, reward);
  };
}
