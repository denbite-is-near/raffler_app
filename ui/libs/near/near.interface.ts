import { NearManagerProvider } from "ioc/types";

export interface INearManager {
  getInstance: NearManagerProvider;
  explorerUrl: string;
}
