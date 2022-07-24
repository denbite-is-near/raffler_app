import { Token } from "types";

export type AccountEntityInput = {
  id: string;
  yoctoBalance: string;
  tokens: Token[];
};
