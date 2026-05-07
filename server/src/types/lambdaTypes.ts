type RouteAccess = "public" | "authenticated" | "admin" | "trainerOrAdmin";

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

export { ApiRouteHandler, OldApiHandlers, ApiRouteHandlers, RouteAccess };
