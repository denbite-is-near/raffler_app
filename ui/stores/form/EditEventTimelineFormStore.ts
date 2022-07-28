import { makeAutoObservable, toJS } from "mobx";
import { ContractService } from "services/ContractService";
import WalletService from "services/WalletService";
import { EventStore } from "stores/EventStore";
import { EventId } from "types";
import { IFormField } from "./types/form-field.interface";
import TextFormField from "./types/text.form-field";

class EditEventTimelineFormStore {
  public fields: Record<string, IFormField>;
  public submitting: boolean;

  constructor(
    private eventStore: EventStore,
    private walletService: WalletService,
    private contractService: ContractService
  ) {
    this.fields = {
      started_at: new TextFormField({
        defaultValue: Date.now() + 3600 * 1_000, // + one hour
        label: "Event start time",
        isRequired: true,
        validation: (value) => {
          if (value <= Date.now())
            return "Start time couldn't be set before now";

          return null;
        },
      }),
      ended_at: new TextFormField({
        defaultValue: Date.now() + 2 * 3600 * 1_000, // + two hours
        label: "Event end time",
        isRequired: true,
        validation: (value) => {
          if (value <= Date.now()) return "End time couldn't be set before now";

          return null;
        },
      }),
    };
    this.submitting = false;

    makeAutoObservable(this, {}, { autoBind: true });
  }

  protected get errors(): Record<string, string> {
    const validationState: Record<string, string> = {};

    Object.entries(this.fields).forEach(([fieldName, field]) => {
      const validatorMessage = field.errorText;

      if (!validatorMessage) return;

      validationState[fieldName] = validatorMessage;
    });

    return validationState;
  }

  get isValidFormValues(): boolean {
    const invalidFieldsCount: number = Object.values(this.errors).length;

    const conditions: boolean[] = [invalidFieldsCount === 0];

    return conditions.every(Boolean);
  }

  public getField = (fieldName: string): IFormField => {
    if (!this.fields[fieldName])
      throw new Error(
        `[EditEventTimelineFormStore] Couldn't getField with name '${fieldName}'`
      );

    return this.fields[fieldName];
  };

  setField = (fieldName: string, value: any): void => {
    if (!this.fields[fieldName])
      throw new Error(
        `[EditEventTimelineFormStore] Couldn't setField with name '${fieldName}'`
      );

    this.fields[fieldName].value = value;
  };

  public highlightErrorFields = (): void => {
    const keys = Object.keys(this.fields);

    keys.forEach((key) => {
      this.fields[key].changed = true;
    });
  };

  public toPlainObject = (): Record<string, any> => {
    const object = Object.keys(this.fields);

    const entries = object.reduce(
      (prev, curr) => ({
        ...prev,
        [curr]: this.getField(curr).value,
      }),
      {}
    );

    return toJS(entries);
  };

  public submit = async (eventId: EventId): Promise<void> => {
    if (!this.isValidFormValues) return;

    this.submitting = true;

    const plain = this.toPlainObject();

    const account = await this.walletService.getWalletAccount();

    const event = this.eventStore.getEvent(eventId);

    if (!event)
      return console.warn(
        `[EditEventTimelineFormStore]submit: Couldn't fidn event with id '${eventId}'`
      );

    const contract = this.contractService.raffler(account);

    await event.setEventTime(contract, {
      start_time: plain.started_at,
      end_time: plain.ended_at,
    });

    // load new event & update all its fields
    await this.eventStore.loadEvent(event.id);

    this.submitting = false;
  };
}

export default EditEventTimelineFormStore;
