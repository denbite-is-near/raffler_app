import { BN } from "bn.js";
import { contractId } from "config";
import { inject, injectable } from "inversify";
import TYPES from "ioc/types";
import { makeAutoObservable } from "mobx";
import { ContractService } from "services/ContractService";
import WalletService from "services/WalletService";
import { AddEvent, EventId, JsonEvent } from "types";
import { AuthStore } from "./AuthStore";

@injectable()
export class EventStore {
  public events: Map<EventId, JsonEvent>;
  public owned_event_ids: Set<EventId>;
  public participation_event_ids: Set<EventId>;

  constructor(
    @inject(TYPES.ContractService) private contractService: ContractService,
    @inject(TYPES.WalletService) private walletService: WalletService,
    @inject(TYPES.AuthStore) private authStore: AuthStore
  ) {
    this.events = new Map();
    this.owned_event_ids = new Set();
    this.participation_event_ids = new Set();

    makeAutoObservable(this, {}, { autoBind: true });
  }

  get allEvents(): JsonEvent[] {
    return Array.from(this.events.values());
  }

  get ownedEvents(): JsonEvent[] {
    if (!this.authStore.account) return [];

    const events = [...this.owned_event_ids].map((eventId) =>
      this.events.get(eventId)
    );

    // @ts-expect-error
    return events.filter(Boolean);
  }

  get participatedEvents(): JsonEvent[] {
    if (!this.authStore.account) return [];

    const events = [...this.participation_event_ids].map((eventId) =>
      this.events.get(eventId)
    );

    // @ts-expect-error
    return events.filter(Boolean);
  }

  public reset = (): void => {
    this.events = new Map();
    this.owned_event_ids = new Set();
    this.participation_event_ids = new Set();
  };

  public addEvent = (event: JsonEvent): void => {
    this.events.set(event.id, event);
  };

  public addOwnedEvent = (eventId: EventId): void => {
    this.owned_event_ids.add(eventId);
  };

  public addParticipatedEvent = (eventId: EventId): void => {
    this.participation_event_ids.add(eventId);
  };

  public setOwnedEvents = async (): Promise<void> => {
    const account = await this.walletService.getWalletAccount();

    const contract = this.contractService.raffler(account);

    const ownedEvents = await contract.get_owner_events({
      account_id: account.accountId,
    });

    ownedEvents.forEach((e) => {
      this.addEvent(e);
      this.addOwnedEvent(e.id);
    });
  };

  public setParticipatedEvents = async (): Promise<void> => {
    const account = await this.walletService.getWalletAccount();

    const contract = this.contractService.raffler(account);

    const ownedEvents = await contract.get_participant_events({
      account_id: account.accountId,
    });

    ownedEvents.forEach((e) => {
      this.addEvent(e);
      this.addParticipatedEvent(e.id);
    });
  };

  public setEvent = async (id: EventId): Promise<void> => {
    const account = await this.walletService.getWalletAccount();

    const contract = this.contractService.raffler(account);

    const event = await contract.get_event({
      event_id: id,
    });

    if (!event) return console.warn(`Couldn't find an event with id '${id}'`);

    this.addEvent(event);
  };

  public createEvent = async (args: AddEvent["args"]): Promise<void> => {
    const account = await this.walletService.getWalletAccount();

    const contract = this.contractService.raffler(account);

    await contract.add_event(args, {
      attachedDeposit: new BN("5000000000000000000000"),
      walletCallbackUrl: window.location.origin, // redirect to home page
    });
  };
}
