import { IForm } from "../../interfaces/IForm";
import { BaseRepository } from "../BaseRepository";
import { FormModel } from "../../models/formPresetModel";

export class FormPresetRepository extends BaseRepository<IForm> {
  constructor() {
    super(FormModel, { type: "trainer", field: "trainerId" });
  }
}
