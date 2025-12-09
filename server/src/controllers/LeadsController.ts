import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import BaseController from "./BaseController";
import LeadsService from "../services/LeadsService";
import { ILead } from "../interfaces/ILead";
import { StatusCode } from "../enums/StatusCode";
import { extractBodyFromEvent, extractQueryFromEvent, getRequestIp } from "../utils/utils";

export default class LeadsController extends BaseController<ILead, LeadsService> {
  constructor() {
    super(new LeadsService());
  }

  create = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const payload = extractBodyFromEvent(event);
      const ip = getRequestIp(event);
      const leadPayload = ip ? { ...payload, ip } : payload;
      const lead = await this.service.createLead(leadPayload);
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
      const { id, error } = this.getParamsOrError(event, ["id"]);

      if (error) return error;

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
      const payload = extractBodyFromEvent(event);
      const { id, error } = this.getParamsOrError(event, ["id"]);

      if (error) return error;

      if (typeof payload.isContacted !== "boolean") {
        return this.errorResponse("isContacted must be a boolean", StatusCode.BAD_REQUEST);
      }

      const updated = await this.service.updateLead(id, { isContacted: payload.isContacted });

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
      const { id, error } = this.getParamsOrError(event, ["id"]);

      if (error) return error;

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
