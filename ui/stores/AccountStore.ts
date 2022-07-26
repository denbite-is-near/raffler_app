import { AccountEntity } from "entities/AccountEntity";
import { inject, injectable } from "inversify";
import TYPES from "ioc/types";
import { makeAutoObservable } from "mobx";
import AccountService from "services/AccountService";
import { Account, AccountId } from "types";

@injectable()
export class AccountStore {
  public accounts: Map<AccountId, AccountEntity>;

  constructor(
    @inject(TYPES.AccountService) private accountService: AccountService
  ) {
    this.accounts = new Map();

    makeAutoObservable(this, {}, { autoBind: true });
  }

  public setAccount = async (accountId: AccountId): Promise<void> => {
    const account = await this.accountService.getAccount(accountId);

    this.upsertAccount(account);
  };

  public upsertAccount = (account: Account): void => {
    const entity = AccountEntity.fromAccount(account);

    this.accounts.set(account.accountId, entity);
  };

  public updateAccountBalance = async (account: Account): Promise<void> => {
    const entity = this.accounts.get(account.accountId);

    if (!entity) return;

    const balance = await account.getAccountBalance();

    entity.setYoctoBalance(balance.available);
  };
}
