import { makeAutoObservable } from "mobx";
import { IFormField } from "./form-field.interface";

class TextFormField<T> implements IFormField<T> {
  public _value: T;
  public label: string;
  public changed: boolean;
  public required: boolean;
  private _validate?: (v: T) => string | null;

  constructor(config: {
    defaultValue: T;
    label: string;
    isRequired?: boolean;
    validation?: (v: T) => string | null;
  }) {
    this._value = config.defaultValue;
    this.label = config.label;
    this.changed = false;
    this.required = config.isRequired || false;

    this._validate = config.validation;

    makeAutoObservable(this, {}, { autoBind: true });
  }

  set value(text: T) {
    this._value = text;

    this.changed = true;
  }

  get value() {
    return this._value;
  }

  get errorText(): string | null {
    // no error if it's default value
    if (!this.changed) return null;

    if (this.required && !this._value) return "Field is required";

    const validationMessage = this._validate?.(this._value);

    if (validationMessage) return validationMessage;

    return null;
  }

  get isValid(): boolean {
    const error = this.errorText;

    if (error === null) return true;

    return false;
  }
}

export default TextFormField;
