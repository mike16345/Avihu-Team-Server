import BaseController from "./BaseController";
import { IForm } from "../interfaces/IForm";
import { FormPresetService } from "../services/FormPresetService";

export default class FormPresetController extends BaseController<IForm, FormPresetService> {
  constructor() {
    super(new FormPresetService());
  }
}
