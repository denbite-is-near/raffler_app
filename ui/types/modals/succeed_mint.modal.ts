import { TokenId } from "types";

export type SucceedMintToken = {
  id: TokenId;
  title: string;
  image_uri: string;
};

export type SucceedMintModalDataType = {
  tokens: SucceedMintToken[];
  amount: number;
};
