import BaseController from "./BaseController";
import { IFormResponse } from "../interfaces/IFormResponse";
import { FormResponseService } from "../services/FormResponseService";
import { APIGatewayProxyEvent } from "aws-lambda";
import { extractBodyFromEvent } from "../utils/utils";
/* import UserService from "../services/userService"; */
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

      /*   if (body.formType === "onboarding") {
        const userService = new UserService();
        await userService.updateById(body.userId, { completedOnboarding: true });
      } */

      this.successResponse({ status: StatusCode.OK, message: "success" });
    } catch (error) {
      return this.errorResponse(error);
    }
  };
}
