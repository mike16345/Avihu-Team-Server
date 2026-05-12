import { APIGatewayProxyEvent } from "aws-lambda";
import type { IUser } from "../interfaces/IUser";

type RouteAccess = "public" | "authenticated" | "subtrainer" | "trainer" | "admin";

type ApiRouteHandler = {
  handler: Function;
  middlewares?: Array<Function>;
  access: RouteAccess;
};

type ApiRouteHandlers = {
  [routeKey: string]: ApiRouteHandler;
};

type OldApiHandlers = {
  [key: string]: Function;
};

type AppEvent = APIGatewayProxyEvent & {
  authUser?: IUser;
};

export { ApiRouteHandler, OldApiHandlers, ApiRouteHandlers, RouteAccess, AppEvent };
