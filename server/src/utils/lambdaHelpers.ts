import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { ApiRouteHandler, ApiRouteHandlers, OldApiHandlers } from "../types/lambdaTypes";

export function getDbName(event: APIGatewayProxyEvent): string {
  return process.env.DB_NAME_PROD!;

  const alias = event?.stageVariables?.lambdaAlias || "prod";

  switch (alias) {
    case "prod":
      return process.env.DB_NAME_PROD!;
    case "dev":
      return process.env.DB_NAME_DEV!;
    default:
      throw new Error(`Unknown stage: ${alias}. Cannot determine DB name.`);
  }
}

const isApiRouteHandler = (value: unknown): value is ApiRouteHandler => {
  return (
    typeof value === "object" &&
    value !== null &&
    "handler" in value &&
    typeof (value as ApiRouteHandler).handler === "function"
  );
};

export const extractRouteHandler = (
  apiHandlers: ApiRouteHandlers | OldApiHandlers,
  routeKey: string
): ApiRouteHandler | null => {
  const route = apiHandlers[routeKey];

  if (!route) {
    console.log(`BAD ROUTE: ${routeKey} is not a valid route!`);
    return null;
  }

  if (isApiRouteHandler(route)) {
    return {
      handler: route.handler,
      access: route.access,
      middlewares: route.middlewares ?? [],
    };
  }

  if (typeof route === "function") {
    return {
      handler: route,
      access: "public", // temporary default for old routes
      middlewares: [],
    };
  }

  console.log(`BAD ROUTE: ${routeKey} has an invalid route config!`);
  return null;
};

export const runMiddlewares = async (
  middlewares: Array<Function>,
  event: APIGatewayProxyEvent,
  context: Context
) => {
  for (const middleware of middlewares) {
    const middlewareResult = await middleware(event, context);

    if (!middlewareResult.isValid) {
      console.log("Middleware failed:", middlewareResult.message);
      return {
        isValid: false,
        message: middlewareResult.message,
      };
    }
  }

  return { isValid: true };
};

export const isHttpError = (
  error: unknown
): error is { message: string; statusCode: number; code?: string } => {
  return typeof error === "object" && error !== null && "message" in error && "statusCode" in error;
};
