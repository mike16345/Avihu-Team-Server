import BaseController from "./BaseController";
import { IFormResponse } from "../interfaces/IFormResponse";
import { FormResponseService } from "../services/FormResponseService";

export default class FormResponseController extends BaseController<
  IFormResponse,
  FormResponseService
> {
  constructor() {
    super(new FormResponseService());
  }
}
