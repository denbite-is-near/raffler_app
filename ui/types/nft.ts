import { AccountId, Base64VecU8, TimestampMs, TokenId, U128, u64 } from "types";

export type TokenMetadata = {
  title?: string;
  description?: string;
  media?: string;
  media_hash?: Base64VecU8;
  copies?: number;
  issued_at?: string;
  expires_at?: string;
  starts_at?: string;
  updated_at?: string;
  extra?: string;
  reference?: string;
  reference_hash?: Base64VecU8;
};

export type Token = {
  token_id: TokenId;
  owner_id: AccountId;
  metadata?: TokenMetadata;
  approved_account_ids?: Record<AccountId, u64>;
};

export type NftContractMetadata = {
  spec: string;
  name: string;
  symbol: string;
  icon?: string;
  base_uri?: string;
  reference?: string;
  reference_hash?: Base64VecU8;
};

enum Status {
  /**
   * Not open for any sales
   */
  Closed = "Closed",
  /**
   * VIP accounts can mint
   */
  Presale = "Presale",
  /**
   * Any account can mint
   */
  Open = "Open",
  /**
   * No more tokens to be minted
   */
  SoldOut = "SoldOut",
}

export type SaleInfo = {
  /**
   * Current state of contract
   */
  status: Status;
  /**
   * Start of the VIP sale
   */
  presale_start: TimestampMs;
  /**
   * Start of public sale
   */
  sale_start: TimestampMs;
  /**
   * Total tokens that could be minted
   */
  token_final_supply: u64;
  /**
   * Current price for one token
   */
  price: U128;
};
