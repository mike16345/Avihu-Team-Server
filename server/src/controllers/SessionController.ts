import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import SessionService from "../services/sessionService";
import { StatusCode } from "../enums/StatusCode";
import { createResponse, createResponseWithData, createServerErrorResponse } from "../utils/utils";
import { ISessionCreate } from "../models/sessionModel";

export default class SessionController {
  static async startSession(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const { userId, type, data } = JSON.parse(event.body || "{}");

    if (!userId || !type) {
      return createResponse(StatusCode.BAD_REQUEST, "userId and type are required.");
    }

    const session: ISessionCreate = {
      userId,
      type,
      data,
    };

    try {
      const result = await SessionService.startSession(session);
      return createResponseWithData(StatusCode.CREATED, result);
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async refreshSession(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const sessionId = event.queryStringParameters?.sessionId;

    if (!sessionId) {
      return createResponse(StatusCode.BAD_REQUEST, "sessionId is required.");
    }

    try {
      const session = await SessionService.refreshSession(sessionId);

      if (!session) {
        return createResponse(StatusCode.NOT_FOUND, "Session not found.");
      }

      return createResponseWithData(StatusCode.OK, session);
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async endSession(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const sessionId = event.queryStringParameters?.sessionId;

    if (!sessionId) {
      return createResponse(StatusCode.BAD_REQUEST, "sessionId is required.");
    }

    try {
      await SessionService.endSession(sessionId);

      return createResponse(StatusCode.NO_CONTENT, "Succesfully ended session.");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async getSessionsByType(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const type = event.queryStringParameters?.type;

    if (!type) {
      return createResponse(StatusCode.BAD_REQUEST, "type is required.");
    }

    try {
      const sessions = await SessionService.getSessionsByType(type);

      if (!sessions) {
        return createResponse(StatusCode.NOT_FOUND, "No sessions found for this type.");
      }

      return createResponseWithData(StatusCode.OK, sessions);
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async getSessionsByUserId(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const userId = event.queryStringParameters?.userId;

    if (!userId) {
      return createResponse(StatusCode.BAD_REQUEST, "userId is required.");
    }

    try {
      const sessions = await SessionService.getSessionsByUserId(userId);

      if (!sessions) {
        return createResponse(StatusCode.NOT_FOUND, "No sessions found for this user.");
      }

      return createResponseWithData(StatusCode.OK, sessions);
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async getSessionById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const sessionId = event.queryStringParameters?.sessionId;

    if (!sessionId) {
      return createResponse(StatusCode.BAD_REQUEST, "sessionId is required.");
    }

    try {
      const session = await SessionService.getSessionById(sessionId);

      if (!session) {
        return createResponse(StatusCode.NOT_FOUND, "Session not found.");
      }

      return createResponseWithData(StatusCode.OK, session);
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }

  static async endAllSessions(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      await SessionService.endAllSessions();
      return createResponse(StatusCode.NO_CONTENT, "Successfully ended all sessions.");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  }
}
