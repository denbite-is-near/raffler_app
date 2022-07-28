import { inject, injectable } from "inversify";
import TYPES from "ioc/types";
import { makeAutoObservable } from "mobx";
import { ContractService } from "services/ContractService";
import WalletService from "services/WalletService";
import { EventStore } from "stores/EventStore";
import AddEventPrizeFormStore from "./AddEventPrizeFormStore";
import CreateEventFormStore from "./CreateEventFormStore";
import EditEventTimelineFormStore from "./EditEventTimelineFormStore";

@injectable()
class RootFormStore {
  public createEvent: CreateEventFormStore;
  public editEventTimeline: EditEventTimelineFormStore;
  public addEventPrize: AddEventPrizeFormStore;

  constructor(
    @inject(TYPES.EventStore) private eventStore: EventStore,
    @inject(TYPES.WalletService) private walletService: WalletService,
    @inject(TYPES.ContractService) private contractService: ContractService
  ) {
    this.createEvent = new CreateEventFormStore(this.eventStore);
    this.editEventTimeline = new EditEventTimelineFormStore(
      this.eventStore,
      this.walletService,
      this.contractService
    );
    this.addEventPrize = new AddEventPrizeFormStore(
      this.eventStore,
      this.walletService,
      this.contractService
    );

    makeAutoObservable(this, {}, { autoBind: true });
  }

  // public setCreateEventForm = (): void => {
  //   this.createEvent = new CreateEventFormStore();
  // };

  // public resetCreateEventForm = (): void => {
  //   this.createEvent = null;
  // };
}

export default RootFormStore;
