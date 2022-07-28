import {
  Account,
  transactions,
  providers,
  DEFAULT_FUNCTION_CALL_GAS,
  u8,
  i8,
  u16,
  i16,
  u32,
  i32,
  u64,
  i64,
  f32,
  f64,
  BN,
  ChangeMethodOptions,
  ViewFunctionOptions,
} from './helper';

/**
* StorageUsage is used to count the amount of storage used by a contract.
*/
export type StorageUsage = u64;
/**
* Balance is a type for storing amounts of tokens, specified in yoctoNEAR.
*/
export type Balance = U128;
/**
* Represents the amount of NEAR tokens in "gas units" which are used to fund transactions.
*/
export type Gas = u64;
/**
* base64 string.
*/
export type Base64VecU8 = string;
/**
* Raw type for duration in nanoseconds
*/
export type Duration = u64;
/**
* @minLength 2
* @maxLength 64
* @pattern ^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$
*/
export type AccountId = string;
/**
* @minLength 2
* @maxLength 64
* @pattern ^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$
*/
export type ValidAccountId = string;
/**
* String representation of a u128-bit integer
* @pattern ^[0-9]+$
*/
export type U128 = string;
/**
* Public key in a binary format with base58 string serialization with human-readable curve.
* The key types currently supported are `secp256k1` and `ed25519`.
* 
* Ed25519 public keys accepted are 32 bytes and secp256k1 keys are the uncompressed 64 format.
*/
export type PublicKey = string;
/**
* Raw type for timestamp in nanoseconds
*/
export type Timestamp = u64;
export type EventId = u64;
export interface JsonEvent {
  id: EventId;
  title: string;
  started_at: TimestampMs;
  ended_at: TimestampMs;
  status: EventStatus;
  prizes: Prize[];
  participants_amount: u64;
  owner_id: AccountId;
}
export enum EventStatus {
  Configuration = "Configuration",
  Visible = "Visible",
  Active = "Active",
  Raffling = "Raffling",
  Claiming = "Claiming",
}
export interface EventPrize {
  event_id: EventId;
  prize_index: u64;
}
export type PrizeType = PrizeTypeNear;
export interface PrizeTypeNear {
  tag: "near",
  val: PrizeTypeNear,
}
export interface PrizeTypeNear {
  amount: U128;
}
export interface Prize {
  prize_type: PrizeType;
  winner_account_id?: AccountId;
  claimed: boolean;
}
export type TimestampMs = u64;
export interface Pagination {
  page: u64;
  limit: u64;
}

export class Contract {
  
  constructor(public account: Account, public readonly contractId: string){}
  
  async add_event(args: {
    title: string;
    start_time?: TimestampMs;
    end_time?: TimestampMs;
  }, options?: ChangeMethodOptions): Promise<EventId> {
    return providers.getTransactionLastResult(await this.add_eventRaw(args, options));
  }
  add_eventRaw(args: {
    title: string;
    start_time?: TimestampMs;
    end_time?: TimestampMs;
  }, options?: ChangeMethodOptions): Promise<providers.FinalExecutionOutcome> {
    return this.account.functionCall({contractId: this.contractId, methodName: "add_event", args, ...options});
  }
  add_eventTx(args: {
    title: string;
    start_time?: TimestampMs;
    end_time?: TimestampMs;
  }, options?: ChangeMethodOptions): transactions.Action {
    return transactions.functionCall("add_event", args, options?.gas ?? DEFAULT_FUNCTION_CALL_GAS, options?.attachedDeposit ?? new BN(0))
  }
  async set_event_time(args: {
    event_id: EventId;
    start_time: TimestampMs;
    end_time: TimestampMs;
  }, options?: ChangeMethodOptions): Promise<void> {
    return providers.getTransactionLastResult(await this.set_event_timeRaw(args, options));
  }
  set_event_timeRaw(args: {
    event_id: EventId;
    start_time: TimestampMs;
    end_time: TimestampMs;
  }, options?: ChangeMethodOptions): Promise<providers.FinalExecutionOutcome> {
    return this.account.functionCall({contractId: this.contractId, methodName: "set_event_time", args, ...options});
  }
  set_event_timeTx(args: {
    event_id: EventId;
    start_time: TimestampMs;
    end_time: TimestampMs;
  }, options?: ChangeMethodOptions): transactions.Action {
    return transactions.functionCall("set_event_time", args, options?.gas ?? DEFAULT_FUNCTION_CALL_GAS, options?.attachedDeposit ?? new BN(0))
  }
  async set_event_visible(args: {
    event_id: EventId;
  }, options?: ChangeMethodOptions): Promise<void> {
    return providers.getTransactionLastResult(await this.set_event_visibleRaw(args, options));
  }
  set_event_visibleRaw(args: {
    event_id: EventId;
  }, options?: ChangeMethodOptions): Promise<providers.FinalExecutionOutcome> {
    return this.account.functionCall({contractId: this.contractId, methodName: "set_event_visible", args, ...options});
  }
  set_event_visibleTx(args: {
    event_id: EventId;
  }, options?: ChangeMethodOptions): transactions.Action {
    return transactions.functionCall("set_event_visible", args, options?.gas ?? DEFAULT_FUNCTION_CALL_GAS, options?.attachedDeposit ?? new BN(0))
  }
  async add_near_prize(args: {
    event_id: EventId;
    amount: U128;
  }, options?: ChangeMethodOptions): Promise<void> {
    return providers.getTransactionLastResult(await this.add_near_prizeRaw(args, options));
  }
  add_near_prizeRaw(args: {
    event_id: EventId;
    amount: U128;
  }, options?: ChangeMethodOptions): Promise<providers.FinalExecutionOutcome> {
    return this.account.functionCall({contractId: this.contractId, methodName: "add_near_prize", args, ...options});
  }
  add_near_prizeTx(args: {
    event_id: EventId;
    amount: U128;
  }, options?: ChangeMethodOptions): transactions.Action {
    return transactions.functionCall("add_near_prize", args, options?.gas ?? DEFAULT_FUNCTION_CALL_GAS, options?.attachedDeposit ?? new BN(0))
  }
  async join_event(args: {
    event_id: EventId;
  }, options?: ChangeMethodOptions): Promise<void> {
    return providers.getTransactionLastResult(await this.join_eventRaw(args, options));
  }
  join_eventRaw(args: {
    event_id: EventId;
  }, options?: ChangeMethodOptions): Promise<providers.FinalExecutionOutcome> {
    return this.account.functionCall({contractId: this.contractId, methodName: "join_event", args, ...options});
  }
  join_eventTx(args: {
    event_id: EventId;
  }, options?: ChangeMethodOptions): transactions.Action {
    return transactions.functionCall("join_event", args, options?.gas ?? DEFAULT_FUNCTION_CALL_GAS, options?.attachedDeposit ?? new BN(0))
  }
  async raffle_event_prizes(args: {
    event_id: EventId;
  }, options?: ChangeMethodOptions): Promise<EventPrize[]> {
    return providers.getTransactionLastResult(await this.raffle_event_prizesRaw(args, options));
  }
  raffle_event_prizesRaw(args: {
    event_id: EventId;
  }, options?: ChangeMethodOptions): Promise<providers.FinalExecutionOutcome> {
    return this.account.functionCall({contractId: this.contractId, methodName: "raffle_event_prizes", args, ...options});
  }
  raffle_event_prizesTx(args: {
    event_id: EventId;
  }, options?: ChangeMethodOptions): transactions.Action {
    return transactions.functionCall("raffle_event_prizes", args, options?.gas ?? DEFAULT_FUNCTION_CALL_GAS, options?.attachedDeposit ?? new BN(0))
  }
  async claim_prize(args: {
    prize: EventPrize;
  }, options?: ChangeMethodOptions): Promise<void> {
    return providers.getTransactionLastResult(await this.claim_prizeRaw(args, options));
  }
  claim_prizeRaw(args: {
    prize: EventPrize;
  }, options?: ChangeMethodOptions): Promise<providers.FinalExecutionOutcome> {
    return this.account.functionCall({contractId: this.contractId, methodName: "claim_prize", args, ...options});
  }
  claim_prizeTx(args: {
    prize: EventPrize;
  }, options?: ChangeMethodOptions): transactions.Action {
    return transactions.functionCall("claim_prize", args, options?.gas ?? DEFAULT_FUNCTION_CALL_GAS, options?.attachedDeposit ?? new BN(0))
  }
  get_owner_events(args: {
    account_id: AccountId;
    pagination?: Pagination;
  }, options?: ViewFunctionOptions): Promise<JsonEvent[]> {
    return this.account.viewFunction(this.contractId, "get_owner_events", args, options);
  }
  get_participant_events(args: {
    account_id: AccountId;
    pagination?: Pagination;
  }, options?: ViewFunctionOptions): Promise<JsonEvent[]> {
    return this.account.viewFunction(this.contractId, "get_participant_events", args, options);
  }
  get_event(args: {
    event_id: EventId;
  }, options?: ViewFunctionOptions): Promise<JsonEvent | null> {
    return this.account.viewFunction(this.contractId, "get_event", args, options);
  }
  get_account_unclaimed_prizes(args: {
    account_id: AccountId;
    pagination?: Pagination;
  }, options?: ViewFunctionOptions): Promise<EventPrize[]> {
    return this.account.viewFunction(this.contractId, "get_account_unclaimed_prizes", args, options);
  }
  is_user_joined_event(args: {
    account_id: AccountId;
    event_id: EventId;
  }, options?: ViewFunctionOptions): Promise<boolean> {
    return this.account.viewFunction(this.contractId, "is_user_joined_event", args, options);
  }
  async new(args = {}, options?: ChangeMethodOptions): Promise<void> {
    return providers.getTransactionLastResult(await this.newRaw(args, options));
  }
  newRaw(args = {}, options?: ChangeMethodOptions): Promise<providers.FinalExecutionOutcome> {
    return this.account.functionCall({contractId: this.contractId, methodName: "new", args, ...options});
  }
  newTx(args = {}, options?: ChangeMethodOptions): transactions.Action {
    return transactions.functionCall("new", args, options?.gas ?? DEFAULT_FUNCTION_CALL_GAS, options?.attachedDeposit ?? new BN(0))
  }
}
/**
* 
* @contractMethod change
*/
export interface AddEvent {
  args: {
    title: string;
    start_time?: TimestampMs;
    end_time?: TimestampMs;
  };
  options: {
    /** Units in gas
    * @pattern [0-9]+
    * @default "30000000000000"
    */
    gas?: string;
    /** Units in yoctoNear
    * @default "0"
    */
    attachedDeposit?: Balance;
  }
  
}
export type AddEvent__Result = EventId;
/**
* 
* @contractMethod change
*/
export interface SetEventTime {
  args: {
    event_id: EventId;
    start_time: TimestampMs;
    end_time: TimestampMs;
  };
  options: {
    /** Units in gas
    * @pattern [0-9]+
    * @default "30000000000000"
    */
    gas?: string;
    /** Units in yoctoNear
    * @default "0"
    */
    attachedDeposit?: Balance;
  }
  
}
export type SetEventTime__Result = void;
/**
* 
* @contractMethod change
*/
export interface SetEventVisible {
  args: {
    event_id: EventId;
  };
  options: {
    /** Units in gas
    * @pattern [0-9]+
    * @default "30000000000000"
    */
    gas?: string;
    /** Units in yoctoNear
    * @default "0"
    */
    attachedDeposit?: Balance;
  }
  
}
export type SetEventVisible__Result = void;
/**
* 
* @contractMethod change
*/
export interface AddNearPrize {
  args: {
    event_id: EventId;
    amount: U128;
  };
  options: {
    /** Units in gas
    * @pattern [0-9]+
    * @default "30000000000000"
    */
    gas?: string;
    /** Units in yoctoNear
    * @default "0"
    */
    attachedDeposit?: Balance;
  }
  
}
export type AddNearPrize__Result = void;
/**
* 
* @contractMethod change
*/
export interface JoinEvent {
  args: {
    event_id: EventId;
  };
  options: {
    /** Units in gas
    * @pattern [0-9]+
    * @default "30000000000000"
    */
    gas?: string;
    /** Units in yoctoNear
    * @default "0"
    */
    attachedDeposit?: Balance;
  }
  
}
export type JoinEvent__Result = void;
/**
* 
* @contractMethod change
*/
export interface RaffleEventPrizes {
  args: {
    event_id: EventId;
  };
  options: {
    /** Units in gas
    * @pattern [0-9]+
    * @default "30000000000000"
    */
    gas?: string;
    /** Units in yoctoNear
    * @default "0"
    */
    attachedDeposit?: Balance;
  }
  
}
export type RaffleEventPrizes__Result = EventPrize[];
/**
* 
* @contractMethod change
*/
export interface ClaimPrize {
  args: {
    prize: EventPrize;
  };
  options: {
    /** Units in gas
    * @pattern [0-9]+
    * @default "30000000000000"
    */
    gas?: string;
    /** Units in yoctoNear
    * @default "0"
    */
    attachedDeposit?: Balance;
  }
  
}
export type ClaimPrize__Result = void;
/**
* 
* @contractMethod view
*/
export interface GetOwnerEvents {
  args: {
    account_id: AccountId;
    pagination?: Pagination;
  };
  
}
export type GetOwnerEvents__Result = JsonEvent[];
/**
* 
* @contractMethod view
*/
export interface GetParticipantEvents {
  args: {
    account_id: AccountId;
    pagination?: Pagination;
  };
  
}
export type GetParticipantEvents__Result = JsonEvent[];
/**
* 
* @contractMethod view
*/
export interface GetEvent {
  args: {
    event_id: EventId;
  };
  
}
export type GetEvent__Result = JsonEvent | null;
/**
* 
* @contractMethod view
*/
export interface GetAccountUnclaimedPrizes {
  args: {
    account_id: AccountId;
    pagination?: Pagination;
  };
  
}
export type GetAccountUnclaimedPrizes__Result = EventPrize[];
/**
* 
* @contractMethod view
*/
export interface IsUserJoinedEvent {
  args: {
    account_id: AccountId;
    event_id: EventId;
  };
  
}
export type IsUserJoinedEvent__Result = boolean;
/**
* 
* @contractMethod change
*/
export interface New {
  args: {};
  options: {
    /** Units in gas
    * @pattern [0-9]+
    * @default "30000000000000"
    */
    gas?: string;
    /** Units in yoctoNear
    * @default "0"
    */
    attachedDeposit?: Balance;
  }
  
}
export type New__Result = void;
