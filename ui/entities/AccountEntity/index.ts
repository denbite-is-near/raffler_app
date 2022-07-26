import { Account, utils } from "near-api-js";
import { AccountId } from "types";

export class AccountEntity {
  public readonly id: AccountId;
  public yoctoBalance: string | null;

  constructor(data: Pick<AccountEntity, "id" | "yoctoBalance">) {
    this.id = data.id;
    this.yoctoBalance = data.yoctoBalance;
  }

  public get balanceInNear(): string | null {
    if (!this.yoctoBalance) return null;

    return utils.format.formatNearAmount(this.yoctoBalance, 3);
  }

  public static fromAccount = (account: Account): AccountEntity => {
    const data = {
      id: account.accountId,
      yoctoBalance: null,
    };

    return new AccountEntity(data);
  };

  public setYoctoBalance = (balance: string): void => {
    this.yoctoBalance = balance;
  };
}
