import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import Joi from "joi";
import BaseController from "./BaseController";
import PublicSignupService from "../services/PublicSignupService";
import { StatusCode } from "../enums/StatusCode";
import { extractBodyFromEvent } from "../utils/utils";

const signupSchema = Joi.object({
  fullName: Joi.string().min(1).max(120).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().optional(),
  source: Joi.string().optional(),
  deviceId: Joi.string().optional(),
});

export default class PublicSignupController extends BaseController<any, PublicSignupService> {
  constructor() {
    super(new PublicSignupService());
  }

  signup = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const body = extractBodyFromEvent(event);
      const { error, value } = signupSchema.validate(body, { abortEarly: false, stripUnknown: true });

      if (error) {
        return {
          statusCode: StatusCode.BAD_REQUEST,
          body: JSON.stringify({ error: "Invalid input" }),
        };
      }

      const result = await this.service.submitSignup(value as {
        fullName: string;
        email: string;
        phone?: string;
        source?: string;
        deviceId?: string;
      });
      const response = {
        statusCode: StatusCode.OK,
        body: JSON.stringify(result),
      };

      await this.afterAction(response);

      return response;
    } catch (err) {
      console.error("[PublicSignupController] Failed to handle signup", err);

      return {
        statusCode: StatusCode.INTERNAL_SERVER_ERROR,
        body: JSON.stringify({ error: "Internal server error" }),
      };
    }
  };
}
