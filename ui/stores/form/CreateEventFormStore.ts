import { makeAutoObservable, toJS } from "mobx";
import { EventStore } from "stores/EventStore";
import { IFormField } from "./types/form-field.interface";
import TextFormField from "./types/text.form-field";

class CreateEventFormStore {
  public fields: Record<string, IFormField>;

  constructor(private eventStore: EventStore) {
    this.fields = {
      title: new TextFormField({
        defaultValue: "",
        label: "Event title",
        isRequired: true,
        validation: (value) => {
          if (value.length < 4)
            return "Title length should be at least 4 symbols";
          if (value.length > 64)
            return "Title length should be maximum of 64 symbols";

          return null;
        },
      }),
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
        `[CreateEventFormStore] Couldn't getField with name '${fieldName}'`
      );

    return this.fields[fieldName];
  };

  setField = (fieldName: string, value: any): void => {
    if (!this.fields[fieldName])
      throw new Error(
        `[CreateEventFormStore] Couldn't setField with name '${fieldName}'`
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

  public submit = async (): Promise<void> => {
    if (!this.isValidFormValues) return;

    const plain = this.toPlainObject();

    await this.eventStore.createEvent({
      title: plain.title,
      start_time: plain.started_at,
      end_time: plain.ended_at,
    });
  };
}

export default CreateEventFormStore;
