import { contractId } from "config";
import { AccountEntity } from "entities/AccountEntity";
import { injectable } from "inversify";
import { Contract } from "types";

@injectable()
export class ContractService {
  private _raffler: Contract | null;

  constructor() {
    this._raffler = null;
  }

  public raffler(account: AccountEntity): Contract {
    if (!this._raffler) {
      this._raffler = new Contract(account, contractId);
    }

    if (account.accountId === this._raffler.account.accountId)
      return this._raffler;

    this._raffler = new Contract(account, contractId);

    return this._raffler;
  }
}
