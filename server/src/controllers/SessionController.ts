import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import SessionService from "../services/sessionService";
import { StatusCode } from "../enums/StatusCode";

import { ISession, ISessionCreate } from "../models/sessionModel";
import BaseController from "./BaseController";

export default class SessionController extends BaseController<ISession, SessionService> {
  constructor() {
    super(new SessionService());
  }

  startSession = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { userId, type, data, error } = this.getParamsOrError(
      event,
      ["userId", "type", "data"],
      "body"
    );

    if (error) return error;
    const session: ISessionCreate = {
      userId,
      type,
      data,
    };

    try {
      const result = await this.service.create(session as ISession);

      return this.successResponse({ status: StatusCode.CREATED, data: result });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  updateSession = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { id, data, error } = this.getParamsOrError(event, ["id", "data"], "body");

    if (error) return error;
    const session: ISessionCreate = {
      data,
    };

    try {
      const result = await this.service.updateById(id, session);

      return this.successResponse({ status: StatusCode.OK, data: result });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  refreshSession = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { sessionId, error } = this.getParamsOrError(event, ["sessionId"], "query");

    if (error) return error;
    try {
      const session = await this.service.refreshSession(sessionId);

      return this.successResponse({ status: StatusCode.OK, data: session });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  endSession = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { sessionId, error } = this.getParamsOrError(event, ["sessionId"], "query").sessionId;

    if (error) return error;

    try {
      await this.service.deleteById(sessionId);

      return this.successResponse({ status: StatusCode.OK, message: "Succesfully ended session." });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  getSessionById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { sessionId, error } = this.getParamsOrError(event, ["sessionId"], "query");

    if (error) return error;

    try {
      const session = await this.service.getSessionById(sessionId);

      if (!session) {
        return this.errorResponse("Session not found or expired.", StatusCode.NOT_FOUND);
      }

      return this.successResponse({ status: StatusCode.OK, data: session });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };
}
