import { AccountEntity } from "entities/AccountEntity";
import { inject, injectable } from "inversify";
import TYPES from "ioc/types";
import { makeAutoObservable } from "mobx";
import AccountService from "services/AccountService";
import {  AccountId } from "types";

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

    this.accounts.set(account.accountId, account);
  };
}
