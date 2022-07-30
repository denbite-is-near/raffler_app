import { BN } from "bn.js";
import { EventEntity } from "entities/EventEntity";
import { inject, injectable } from "inversify";
import TYPES from "ioc/types";
import { makeAutoObservable } from "mobx";
import { computedFn } from "mobx-utils";
import { ContractService } from "services/ContractService";
import WalletService from "services/WalletService";
import { AddEvent, EventId, JsonEvent } from "types";
import { AuthStore } from "./AuthStore";

const STORAGE_PRICE_PER_BYTE = "10000000000000000000"; // 0.0001N

@injectable()
export class EventStore {
  public events: Map<EventId, EventEntity>;
  public participation_event_ids: Set<EventId>;

  constructor(
    @inject(TYPES.ContractService) private contractService: ContractService,
    @inject(TYPES.WalletService) private walletService: WalletService,
    @inject(TYPES.AuthStore) private authStore: AuthStore
  ) {
    this.events = new Map();
    this.participation_event_ids = new Set();

    makeAutoObservable(this, {}, { autoBind: true });
  }

  get allEvents(): EventEntity[] {
    return Array.from(this.events.values());
  }

  get ownedEvents(): EventEntity[] {
    const account = this.authStore.account;

    if (!account) return [];

    return this.allEvents.filter((e) => e.isUserEventOwner(account.id));
  }

  get participatedEvents(): EventEntity[] {
    if (!this.authStore.account) return [];

    const events = [...this.participation_event_ids].map((eventId) =>
      this.events.get(eventId)
    );

    // @ts-expect-error
    return events.filter(Boolean);
  }

  public areYouOwnerOfEvent = computedFn((id: EventId): boolean => {
    const account = this.authStore.account;

    if (!account) return false;

    const event = this.getEvent(id);

    if (!event) return false;

    return event.isUserEventOwner(account.id);
  });

  public areYouParticipatingAtEvent = computedFn((id: EventId): boolean => {
    const account = this.authStore.account;

    if (!account) return false;

    const event = this.getEvent(id);

    if (!event) return false;

    return this.participation_event_ids.has(id);
  });

  public getEvent = computedFn((id: EventId): EventEntity | null => {
    return this.events.get(id) || null;
  });

  public reset = (): void => {
    this.events = new Map();
    this.participation_event_ids = new Set();
  };

  public addEvent = (event: JsonEvent): void => {
    const entity = EventEntity.fromJsonEvent(event);

    this.events.set(entity.id, entity);
  };

  public addParticipatedEvent = (eventId: EventId): void => {
    this.participation_event_ids.add(eventId);
  };

  public loadOwnedEvents = async (): Promise<void> => {
    const account = await this.walletService.getWalletAccount();

    const contract = this.contractService.raffler(account);

    const ownedEvents = await contract.get_owner_events({
      account_id: account.accountId,
    });

    ownedEvents.forEach((e) => {
      this.addEvent(e);
    });
  };

  public loadParticipatedEvents = async (): Promise<void> => {
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

  public loadEvent = async (id: EventId): Promise<void> => {
    const account = await this.walletService.getWalletAccount();

    const contract = this.contractService.raffler(account);

    const event = await contract.get_event({
      event_id: id,
    });

    if (!event) return console.warn(`Couldn't find an event with id '${id}'`);

    this.addEvent(event);
  };

  public loadEventParticipatingStatus = async (id: EventId): Promise<void> => {
    if (!this.authStore.account) return;

    const account = await this.walletService.getWalletAccount();

    const contract = this.contractService.raffler(account);

    const isParticipating = await contract.is_user_joined_event({
      event_id: id,
      account_id: this.authStore.account.id,
    });

    if (!isParticipating) return;

    this.addParticipatedEvent(id);
  };

  public createEvent = async (args: AddEvent["args"]): Promise<void> => {
    const account = await this.walletService.getWalletAccount();

    const contract = this.contractService.raffler(account);

    await contract.add_event(args, {
      attachedDeposit: new BN("7500000000000000000000"),
      walletCallbackUrl: window.location.origin, // redirect to home page
    });
  };

  public setEventVisible = async (eventId: EventId): Promise<void> => {
    const account = await this.walletService.getWalletAccount();

    const contract = this.contractService.raffler(account);

    await contract.set_event_visible({
      event_id: eventId,
    });

    await this.loadEvent(eventId);
  };

  public raffleEventPrizes = async (
    eventId: EventId,
    prizes: number
  ): Promise<void> => {
    const account = await this.walletService.getWalletAccount();

    const contract = this.contractService.raffler(account);

    await contract.raffle_event_prizes(
      {
        event_id: eventId,
      },
      {
        attachedDeposit: new BN("4500000000000000000000").muln(prizes),
      }
    );

    await this.loadEvent(eventId);
  };

  public joinEvent = async (event: EventEntity): Promise<void> => {
    if (!this.authStore.account) return;

    const account = await this.walletService.getWalletAccount();

    const contract = this.contractService.raffler(account);

    await contract.join_event(
      {
        event_id: event.id,
      },
      {
        attachedDeposit: new BN(STORAGE_PRICE_PER_BYTE)
          .muln(
            this.authStore.account.id.length + 4 // to also cover structs
          )
          .add(new BN("2750000000000000000000"))
          .muln(2),
      }
    );

    this.addParticipatedEvent(event.id);
  };
}
