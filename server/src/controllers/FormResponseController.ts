import BaseController from "./BaseController";
import { IFormResponse } from "../interfaces/IFormResponse";
import { FormResponseService } from "../services/FormResponseService";
import { APIGatewayProxyEvent } from "aws-lambda";
import { extractBodyFromEvent } from "../utils/utils";
import UserService from "../services/userService";

export default class FormResponseController extends BaseController<
  IFormResponse,
  FormResponseService
> {
  constructor() {
    super(new FormResponseService());
  }

  async saveSubmission(event: APIGatewayProxyEvent) {
    const { userId } = extractBodyFromEvent(event);
    try {
      const response = await this.create(event);
      await new UserService().updateById(userId, { completedOnboarding: true });

      return response;
    } catch (error) {
      return this.errorResponse(error);
    }
  }
}
