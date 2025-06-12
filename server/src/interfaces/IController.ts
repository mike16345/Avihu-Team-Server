import {
  APIGatewayProxyEvent,
  APIGatewayEventRequestContext,
  APIGatewayProxyResult,
} from "aws-lambda";
import { IResponse, IServerResponseParams } from "./IResponse";
import { StatusCode } from "../enums/StatusCode";

export interface IBaseController<T> {
  getPaginated: (
    event: APIGatewayProxyEvent,
    context?: APIGatewayEventRequestContext
  ) => Promise<APIGatewayProxyResult>;

  getAll: (
    event: APIGatewayProxyEvent,
    context?: APIGatewayEventRequestContext
  ) => Promise<APIGatewayProxyResult>;
  getById: (
    event: APIGatewayProxyEvent,
    context?: APIGatewayEventRequestContext
  ) => Promise<APIGatewayProxyResult>;
  create: (
    event: APIGatewayProxyEvent,
    context?: APIGatewayEventRequestContext
  ) => Promise<APIGatewayProxyResult>;
  update: (
    event: APIGatewayProxyEvent,
    context?: APIGatewayEventRequestContext
  ) => Promise<APIGatewayProxyResult>;
  delete: (
    event: APIGatewayProxyEvent,
    context?: APIGatewayEventRequestContext
  ) => Promise<APIGatewayProxyResult>;
  successResponse: (response: IServerResponseParams) => IResponse;
  errorResponse: (error?: any, statusCode?: StatusCode) => IResponse;
}
