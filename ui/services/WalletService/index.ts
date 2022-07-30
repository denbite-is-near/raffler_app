import { contractId } from "config";
import { inject, injectable } from "inversify";
import TYPES from "ioc/types";
import type { INearManager } from "libs/near";
import { WalletConnection, ConnectedWalletAccount } from "near-api-js";

@injectable()
class WalletService {
  private _wallet?: WalletConnection | null;

  constructor(
    @inject(TYPES.NearManager)
    private nearManager: INearManager
  ) {}

  private getWallet = async (): Promise<WalletConnection> => {
    // if (this._wallet) return this._wallet;

    const near = await this.nearManager.getInstance();

    // this._wallet = new WalletConnection(near, null);

    // return Promise.resolve(this._wallet);
    return new WalletConnection(near, null);
  };

  public requestLogin = async (): Promise<void> => {
    const wallet = await this.getWallet();

    await wallet.requestSignIn({
      contractId,
      successUrl: window.location.origin + "/auth",
      failureUrl: window.location.origin + "/auth",
    });
  };

  public requestLogout = async (): Promise<void> => {
    const wallet = await this.getWallet();

    wallet.signOut();
  };

  public getWalletAccount = async (): Promise<ConnectedWalletAccount> => {
    const wallet = await this.getWallet();

    return wallet.account();
  };
}

export default WalletService;
