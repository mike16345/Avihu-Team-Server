import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import Joi from "joi";
import BaseController from "./BaseController";
import LeadsService from "../services/LeadsService";
import { ILead } from "../interfaces/ILead";
import { StatusCode } from "../enums/StatusCode";
import { extractBodyFromEvent, extractQueryFromEvent } from "../utils/utils";

const createLeadSchema = Joi.object({
  fullName: Joi.string().trim().max(120).required(),
  email: Joi.string().trim().lowercase().email().max(256).required(),
  phone: Joi.string().trim().max(64).optional(),
  deviceId: Joi.string().trim().max(128).optional(),
  registeredAt: Joi.date().optional(),
});

const updateLeadSchema = Joi.object({
  fullName: Joi.string().trim().max(120),
  email: Joi.string().trim().lowercase().email().max(256),
  phone: Joi.string().trim().max(64),
  deviceId: Joi.string().trim().max(128),
  registeredAt: Joi.date(),
})
  .min(1)
  .messages({
    "object.min": "Invalid payload",
  });

export default class LeadsController extends BaseController<ILead, LeadsService> {
  constructor() {
    super(new LeadsService());
  }

  private extractIp(event: APIGatewayProxyEvent): string | undefined {
    const headers = event.headers || {};
    const forwardedFor = headers["x-forwarded-for"] || headers["X-Forwarded-For"];

    if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
      return forwardedFor.split(",")[0].trim();
    }

    return event.requestContext?.identity?.sourceIp || undefined;
  }

  create = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const payload = extractBodyFromEvent(event);
      const { value, error } = createLeadSchema.validate(payload, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        return this.errorResponse("Invalid payload", StatusCode.BAD_REQUEST);
      }

      const ip = this.extractIp(event);
      const lead = await this.service.createLead({ ...value, ip });
      const response = this.successResponse({
        status: StatusCode.CREATED,
        data: lead,
      });

      await this.afterAction(response);

      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };

  list = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const query = extractQueryFromEvent(event);
      const leads = await this.service.listLeads({
        page: query.page,
        limit: query.limit,
      });

      const response = this.successResponse({
        status: StatusCode.OK,
        data: leads,
      });

      await this.afterAction(response);

      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };

  getById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const id = event.pathParameters?.id;

      if (!id) {
        return this.errorResponse("Lead id is required", StatusCode.BAD_REQUEST);
      }

      const lead = await this.service.getLeadById(id);

      if (!lead) {
        return this.errorResponse("Lead not found", StatusCode.NOT_FOUND);
      }

      const response = this.successResponse({
        status: StatusCode.OK,
        data: lead,
      });

      await this.afterAction(response);

      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };

  update = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const id = event.pathParameters?.id;

      if (!id) {
        return this.errorResponse("Lead id is required", StatusCode.BAD_REQUEST);
      }

      const payload = extractBodyFromEvent(event);
      const { value, error } = updateLeadSchema.validate(payload, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        return this.errorResponse("Invalid payload", StatusCode.BAD_REQUEST);
      }

      const updated = await this.service.updateLead(id, value);

      if (!updated) {
        return this.errorResponse("Lead not found", StatusCode.NOT_FOUND);
      }

      const response = this.successResponse({
        status: StatusCode.OK,
        data: updated,
      });

      await this.afterAction(response);

      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };

  remove = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const id = event.pathParameters?.id;

      if (!id) {
        return this.errorResponse("Lead id is required", StatusCode.BAD_REQUEST);
      }

      const deleted = await this.service.deleteLead(id);

      if (!deleted) {
        return this.errorResponse("Lead not found", StatusCode.NOT_FOUND);
      }

      const response: APIGatewayProxyResult = {
        statusCode: StatusCode.NO_CONTENT,
        body: "",
      };

      await this.afterAction(response);

      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };
}
