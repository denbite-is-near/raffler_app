import { BN } from "bn.js";
import { makeAutoObservable } from "mobx";
import { computedFn } from "mobx-utils";
import {
  AccountId,
  AddNearPrize,
  Contract,
  EventId,
  EventStatus,
  JsonEvent,
  Prize,
  SetEventTime,
  SetEventVisible,
  TimestampMs,
  u64,
} from "types";

export class EventEntity implements JsonEvent {
  public readonly id: EventId;
  public title: string;
  public started_at: TimestampMs;
  public ended_at: TimestampMs;
  public status: EventStatus;
  public prizes: Prize[];
  public participants_amount: u64;
  public owner_id: AccountId;

  constructor(data: JsonEvent) {
    this.id = data.id;
    this.title = data.title;
    this.started_at = data.started_at;
    this.ended_at = data.ended_at;
    this.status = data.status;
    this.prizes = data.prizes;
    this.participants_amount = data.participants_amount;
    this.owner_id = data.owner_id;

    makeAutoObservable(this, {}, { autoBind: true });
  }

  public static fromJsonEvent = (json: JsonEvent): EventEntity => {
    return new EventEntity(json);
  };

  public isUserEventOwner = computedFn((accountId: AccountId): boolean => {
    return this.owner_id === accountId;
  });

  public setEventTime = async (
    contract: Contract,
    args: Omit<SetEventTime["args"], "event_id">
  ): Promise<void> => {
    await contract.set_event_time({
      ...args,
      event_id: this.id,
    });

    // optimistic
    this.started_at = args.start_time;
    this.ended_at = args.end_time;
  };

  public addNearPrize = async (
    contract: Contract,
    args: Omit<AddNearPrize["args"], "event_id">
  ): Promise<void> => {
    const storageFee = new BN("10000000000000000000000");

    const deposit = new BN(args.amount).add(storageFee);

    await contract.add_near_prize(
      {
        ...args,
        event_id: this.id,
      },
      {
        attachedDeposit: deposit,
      }
    );
  };
}
