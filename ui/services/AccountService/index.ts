import { inject, injectable } from "inversify";
import TYPES from "ioc/types";
import type { INearManager } from "libs/near";
import { Account } from "near-api-js";

@injectable()
class AccountService {
  constructor(
    @inject(TYPES.NearManager)
    private nearManager: INearManager
  ) {}

  public getAccount = async (accountId: string): Promise<Account> => {
    const near = await this.nearManager.getInstance();

    return near.account(accountId);
  };

  public getAccountBalance = async (
    accountId: string
  ): Promise<ReturnType<Account["getAccountBalance"]>> => {
    const account = await this.getAccount(accountId);

    return account.getAccountBalance();
  };
}

export default AccountService;
