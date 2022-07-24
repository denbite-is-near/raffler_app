export interface IFormField<T = any> {
  value: T;
  label: string;
  isValid: boolean;
  errorText: string | null;
  changed: boolean;
  required: boolean;
}
