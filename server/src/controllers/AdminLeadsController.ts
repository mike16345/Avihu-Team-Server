import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import BaseController from "./BaseController";
import AdminLeadsService from "../services/AdminLeadsService";
import { StatusCode } from "../enums/StatusCode";

export default class AdminLeadsController extends BaseController<any, AdminLeadsService> {
  constructor() {
    super(new AdminLeadsService());
  }

  getLeads = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);
    try {
      const leads = await this.service.getLeads();
      const response = {
        statusCode: StatusCode.OK,
        body: JSON.stringify(leads),
      };
      await this.afterAction(response);
      return response;
    } catch (error) {
      console.error("[AdminLeadsController] Failed to fetch leads", error);
      return {
        statusCode: StatusCode.INTERNAL_SERVER_ERROR,
        body: JSON.stringify({ error: "Failed to fetch leads" }),
      };
    }
  };
}
