import { inject, injectable } from "inversify";
import TYPES from "ioc/types";
import type { INearManager } from "libs/near";
import { FinalExecutionOutcome } from "near-api-js/lib/providers";

@injectable()
class NearService {
  constructor(
    @inject(TYPES.NearManager)
    private nearManager: INearManager
  ) {}

  public getTxStatus = async (
    txHash: string,
    accountId: string
  ): Promise<FinalExecutionOutcome | undefined> => {
    const near = await this.nearManager.getInstance();

    try {
      return await near.connection.provider.txStatus(txHash, accountId);
      // @ts-expect-error
    } catch (err: Error) {
      console.error(
        `Something went wrong while requesting tx '${txHash}' - ${err.message}`
      );
    }
  };

  public getTxUrl = (txHash: string): string => {
    const explorerUrl = this.nearManager.explorerUrl;

    return explorerUrl + "/transactions/" + txHash;
  };
}

export default NearService;
