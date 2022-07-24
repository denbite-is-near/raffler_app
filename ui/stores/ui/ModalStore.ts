import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";
import { ModalDataType, ModalType } from "types/modals";

@injectable()
class ModalStore {
  public modalData: ModalDataType | null;

  constructor() {
    this.modalData = null;

    makeAutoObservable(this, {}, { autoBind: true });
  }

  get activeModal(): ModalType | null {
    if (!this.modalData) return null;

    return this.modalData.type;
  }

  public showModal = (modalData: ModalDataType): void => {
    // can't override modal
    if (this.activeModal) return;

    this.modalData = modalData;
  };

  public hideModal = (): void => {
    this.modalData = null;
  };
}

export default ModalStore;
