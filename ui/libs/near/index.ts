import { inject, injectable } from "inversify";
import TYPES from "ioc/types";
import type { NearManagerProvider } from "ioc/types";
import * as nearAPI from "near-api-js";
import { ConnectConfig } from "near-api-js";
import { getNearConfig } from "./config";
import { INearManager } from "./near.interface";

@injectable()
class Near implements INearManager {
  private _near?: nearAPI.Near;

  constructor(
    @inject(TYPES.NearManagerProvider)
    private _NearManagerProvider: NearManagerProvider
  ) {}

  public getInstance = async (): Promise<nearAPI.Near> => {
    if (this._near) return this._near;

    this._near = await this._NearManagerProvider();

    return Promise.resolve(this._near);
  };

  get explorerUrl(): string {
    if (!this._near) throw new Error("ExplorerUrl is used before NEAR inited");

    const nearConfig: ConnectConfig = this._near.config;

    return `https://explorer.${nearConfig.networkId}.near.org`;
  }
}

export type { INearManager };

export { getNearConfig };

export default Near;
