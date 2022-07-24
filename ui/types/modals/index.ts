import { SucceedMintModalDataType } from "./succeed_mint.modal";

export enum ModalType {
  SUCCEED_MINT = "succeed_mint",
}

export type ModalDataType = {
  type: ModalType.SUCCEED_MINT;
  data: SucceedMintModalDataType;
};
