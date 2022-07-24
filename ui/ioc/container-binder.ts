import Near, { INearManager, getNearConfig } from "libs/near";
import * as nearApi from "near-api-js";
import AccountService from "services/AccountService";
import NearService from "services/NearService";
import WalletService from "services/WalletService";
import { AuthStore } from "stores/AuthStore";
import container from "./container";
import TYPES, { NearManagerProvider } from "./types";
import { AccountStore } from "stores/AccountStore";
import { nearNetwork } from "config";
import ModalStore from "stores/ui/ModalStore";
import { ContractService } from "services/ContractService";
import { EventStore } from "stores/EventStore";
import RootFormStore from "stores/form/RootFormStore";

const nearServiceFactory = async (): Promise<nearApi.Near> => {
  const config = getNearConfig(nearNetwork);

  return await nearApi.connect(config);
};

container
  .bind<NearManagerProvider>(TYPES.NearManagerProvider)
  .toProvider<nearApi.Near>(() => nearServiceFactory);

container.bind<INearManager>(TYPES.NearManager).to(Near).inSingletonScope();

container.bind(TYPES.NearService).to(NearService).inSingletonScope();

container.bind(TYPES.WalletService).to(WalletService).inSingletonScope();

container.bind(TYPES.AccountService).to(AccountService).inSingletonScope();
container.bind(TYPES.ContractService).to(ContractService).inSingletonScope();

container.bind(TYPES.AuthStore).to(AuthStore).inSingletonScope();
container.bind(TYPES.EventStore).to(EventStore).inSingletonScope();
container.bind(TYPES.AccountStore).to(AccountStore).inSingletonScope();
container.bind(TYPES.FormStore).to(RootFormStore).inSingletonScope();

container.bind(TYPES.ModalStore).to(ModalStore).inSingletonScope();
