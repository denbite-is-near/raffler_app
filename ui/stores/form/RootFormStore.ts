import { inject, injectable } from "inversify";
import TYPES from "ioc/types";
import { makeAutoObservable } from "mobx";
import { EventStore } from "stores/EventStore";
import CreateEventFormStore from "./CreateEventFormStore";

@injectable()
class RootFormStore {
  public createEvent: CreateEventFormStore;

  constructor(@inject(TYPES.EventStore) private eventStore: EventStore) {
    this.createEvent = new CreateEventFormStore(this.eventStore);

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
