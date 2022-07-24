import { inject, injectable } from "inversify";
import TYPES from "ioc/types";
import { makeAutoObservable } from "mobx";
import WalletService from "services/WalletService";
import { AccountStore } from "./AccountStore";
import { AccountEntity } from "entities/AccountEntity";
import { AccountId } from "types";

@injectable()
export class AuthStore {
  public accountId: AccountId | null;
  public authInProgress: boolean;

  constructor(
    @inject(TYPES.WalletService) private walletService: WalletService,
    @inject(TYPES.AccountStore) private accountStore: AccountStore
  ) {
    this.authInProgress = false;
    this.accountId = null;

    makeAutoObservable(this, {}, { autoBind: true });
  }

  public get account(): AccountEntity | null {
    if (!this.accountId) return null;

    return this.accountStore.accounts.get(this.accountId) || null;
  }

  public get isLoggedIn(): boolean {
    return Boolean(this.account);
  }

  public login = async (): Promise<void> => {
    this.setAuthProgress(true);

    await this.walletService.requestLogin();

    await this.updateAuthAccount();

    this.setAuthProgress(false);
  };

  public logout = async (): Promise<void> => {
    // account should be logged in
    if (!this.accountId) return;

    this.setAuthProgress(true);

    await this.walletService.requestLogout();

    await this.updateAuthAccount();

    this.setAuthProgress(false);
  };

  private resetAuthAccount = (): void => {
    this.setAccountId(null);
  };

  private setAuthAccount = async (account: AccountEntity): Promise<void> => {
    await this.accountStore.setAccount(account.accountId);

    this.setAccountId(account.accountId);
  };

  public updateAuthAccount = async (): Promise<void> => {
    const walletAccount = await this.walletService.getWalletAccount();

    console.log("walletAccount", walletAccount);

    const walletIsLoggedIn =
      walletAccount.walletConnection.isSignedIn() &&
      walletAccount.walletConnection.getAccountId();

    if (!walletIsLoggedIn) return this.resetAuthAccount();

    await this.setAuthAccount(walletAccount);
  };

  protected setAccountId = (id: this["accountId"]): void => {
    this.accountId = id;
  };

  protected setAuthProgress = (inProgress: boolean): void => {
    this.authInProgress = inProgress;
  };
}
