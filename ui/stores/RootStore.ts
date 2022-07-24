import container from "ioc/container";
// perform container binding
import "ioc/container-binder";

import TYPES from "ioc/types";
import NearService from "services/NearService";
import { AccountStore } from "./AccountStore";
import { AuthStore } from "./AuthStore";
import { EventStore } from "./EventStore";
import RootFormStore from "./form/RootFormStore";
import ModalStore from "./ui/ModalStore";

export class RootStore {
  public authStore: AuthStore;
  public accountStore: AccountStore;

  public modalStore: ModalStore;
  public eventStore: EventStore;
  public formStore: RootFormStore;

  /** Services */
  public nearService: NearService;

  constructor() {
    this.authStore = container.get(TYPES.AuthStore);
    this.accountStore = container.get(TYPES.AccountStore);

    this.modalStore = container.get(TYPES.ModalStore);
    this.eventStore = container.get(TYPES.EventStore);
    this.formStore = container.get(TYPES.FormStore);

    this.nearService = container.get(TYPES.NearService);

    // init only on client side
    if (
      process.env.NODE_ENV !== "production" &&
      typeof window !== "undefined"
    ) {
      // for debugging;
      // @ts-ignore
      window.store = this;
    }
  }

  public handleTx = async (txHash: string): Promise<void> => {
    const txUrl = this.nearService.getTxUrl(txHash);

    console.log(`Found tx => ${txUrl}`);

    if (!this.authStore.accountId) return;

    const tx = await this.nearService.getTxStatus(
      txHash,
      this.authStore.accountId
    );

    if (!tx) return;

    const isSuccess = Object(tx.status).hasOwnProperty("SuccessValue");

    const transactionActions: any[] = tx.transaction?.actions || [];

    const mintAction = transactionActions.find(
      (action) => action?.["FunctionCall"]?.method_name === "nft_mint_many"
    );

    const isMintFunction = Boolean(mintAction);

    const stringifiedArgs = Buffer.from(
      mintAction["FunctionCall"].args,
      "base64"
    ).toString();

    const args = JSON.parse(stringifiedArgs);

    if (!isSuccess || !isMintFunction || !args.num) return;

    // we verified that this field exist
    const transactionResult = JSON.parse(
      // @ts-expect-error
      Buffer.from(tx.status["SuccessValue"], "base64").toString()
    );

    const tokens = transactionResult.map((r: any) => ({
      id: r.token_id,
      title: r.metadata.title,
      image_uri: r.metadata.media,
    }));
  };

  public get isReady(): boolean {
    return true;
  }
}
