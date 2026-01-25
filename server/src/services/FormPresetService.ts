import { IForm } from "../interfaces/IForm";
import { FormPresetRepository } from "../repositories/Presets/FormPresetRepository";
import { BaseService } from "./BaseService";

const RESOURCE_NAME = "form-preset";

export class FormPresetService extends BaseService<IForm, FormPresetRepository> {
  constructor() {
    super(new FormPresetRepository(), RESOURCE_NAME);
  }
}
