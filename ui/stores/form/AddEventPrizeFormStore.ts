import { BN } from "bn.js";
import { EventEntity } from "entities/EventEntity";
import { makeAutoObservable, toJS } from "mobx";
import { utils } from "near-api-js";
import { ContractService } from "services/ContractService";
import WalletService from "services/WalletService";
import { EventStore } from "stores/EventStore";
import { EventId } from "types";
import { IFormField } from "./types/form-field.interface";
import TextFormField from "./types/text.form-field";

const MIN_NEAR_PRIZE_AMOUNT = "100000000000000000000000"; // 0.1N

class AddEventPrizeFormStore {
  public fields: Record<string, IFormField>;
  public submitting: boolean;

  constructor(
    private eventStore: EventStore,
    private walletService: WalletService,
    private contractService: ContractService
  ) {
    this.fields = {
      amount: new TextFormField({
        defaultValue: utils.format.formatNearAmount(MIN_NEAR_PRIZE_AMOUNT),
        label: "Prize amount",
        isRequired: true,
        validation: (value) => {
          try {
            const isNumber = /^-?[\d.]+(?:e-?\d+)?$/.test(value);

            if (!isNumber) return "'amount' could be only the number";

            const min = new BN(MIN_NEAR_PRIZE_AMOUNT);
            const actual = new BN(
              utils.format.parseNearAmount(value.toString()) || 0
            );

            if (actual < min)
              return `Near prize couldn't be less than ${utils.format.formatNearAmount(
                MIN_NEAR_PRIZE_AMOUNT,
                3
              )}N`;
          } catch {
            return "Invalid number";
          }

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
        `[AddEventPrizeFormStore] Couldn't getField with name '${fieldName}'`
      );

    return this.fields[fieldName];
  };

  setField = (fieldName: string, value: any): void => {
    if (!this.fields[fieldName])
      throw new Error(
        `[AddEventPrizeFormStore] Couldn't setField with name '${fieldName}'`
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

  public submit = async (event: EventEntity): Promise<void> => {
    if (!this.isValidFormValues) return;

    this.submitting = true;

    const plain = this.toPlainObject();

    const amount = utils.format.parseNearAmount(plain.amount);

    if (!amount) return;

    const account = await this.walletService.getWalletAccount();

    const contract = this.contractService.raffler(account);

    await event.addNearPrize(contract, {
      amount,
    });

    // load new event & update all its fields
    await this.eventStore.loadEvent(event.id);

    this.submitting = false;
  };
}

export default AddEventPrizeFormStore;
