import { APIGatewayProxyResult } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";

export interface IResponse extends APIGatewayProxyResult {}

export interface IServerResponseParams {
  status?: StatusCode;
  message?: string;
  data?: any;
}
