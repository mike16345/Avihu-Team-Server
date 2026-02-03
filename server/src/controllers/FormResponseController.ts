import BaseController from "./BaseController";
import { IFormResponse } from "../interfaces/IFormResponse";
import { FormResponseService } from "../services/FormResponseService";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { extractBodyFromEvent } from "../utils/utils";
import { StatusCode } from "../enums/StatusCode";

export default class FormResponseController extends BaseController<
  IFormResponse,
  FormResponseService
> {
  constructor() {
    super(new FormResponseService());
  }

  saveSubmission = async (event: APIGatewayProxyEvent) => {
    const body = extractBodyFromEvent(event);
    try {
      await this.service.create(body);

      return this.successResponse({ status: StatusCode.OK, message: "success" });
    } catch (error) {
      return this.errorResponse(error);
    }
  };

  checkOffResponse = async (event: APIGatewayProxyEvent) => {
    const body = extractBodyFromEvent(event);
    const { id, isChecked } = body;

    try {
      await this.service.updateById(id, { isChecked });

      return this.successResponse({ status: StatusCode.OK, message: "success" });
    } catch (error) {
      return this.errorResponse(error);
    }
  };
}
