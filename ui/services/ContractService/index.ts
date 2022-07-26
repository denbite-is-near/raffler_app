import { contractId } from "config";
import { injectable } from "inversify";
import { Account, Contract } from "types";

@injectable()
export class ContractService {
  private _raffler: Contract | null;

  constructor() {
    this._raffler = null;
  }

  public raffler(account: Account): Contract {
    if (!this._raffler) {
      this._raffler = new Contract(account, contractId);
    }

    if (account.accountId === this._raffler.account.accountId)
      return this._raffler;

    this._raffler = new Contract(account, contractId);

    return this._raffler;
  }
}
