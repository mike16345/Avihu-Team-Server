import { Context, APIGatewayProxyResult } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import connectToDB from "../db/connect";
import { createResponse, extractBearerToken, getHeaderValue } from "../utils/utils";
import { API_HEADERS } from "../constants/Constants";
import {
  extractRouteHandler,
  runMiddlewares,
  getDbName,
  isHttpError,
} from "../utils/lambdaHelpers";
import { ApiRouteHandlers, AppEvent, OldApiHandlers } from "../types/lambdaTypes";
import { enforceRequestUserAccess } from "../guards/AdminAccessGuard";
import JwtAuthService, { AccessClaims } from "../services/JwtAuthService";
import { runWithAuthContext, updateAuthContext } from "../utils/authContext";

type VerifiedAccessClaims = AccessClaims & {
  trainerId?: string;
  subTrainerId?: string;
};

const jwtAuthService = new JwtAuthService();

const buildAuthContextFromClaims = (claims?: VerifiedAccessClaims) => {
  if (!claims) {
    return {};
  }
  const isAdminOrTrainer = claims.role === "admin" || claims.role === "trainer";

  return {
    userId: claims.sub || claims.userId || claims._id,
    trainerId: isAdminOrTrainer ? (claims.trainerId ? claims.userId : undefined) : undefined,
    role: claims.role,
  };
};

const buildAuthContextFromUser = (event: AppEvent) => {
  const authUser = event.authUser;

  if (!authUser) {
    return {};
  }

  return {
    userId: authUser._id?.toString(),
    trainerId: authUser.trainerId?.toString(),
    role: authUser.role,
  };
};

export const handleApiCall = async (
  event: AppEvent,
  context: Context,
  apiHandlers: OldApiHandlers | ApiRouteHandlers,
  apiValidators?: OldApiHandlers
): Promise<APIGatewayProxyResult> => {
  context.callbackWaitsForEmptyEventLoop = false;
  const { httpMethod, path } = event;
  const routeKey = `${httpMethod} ${path}`;
  const requestId = event.requestContext?.requestId;
  const hasAuthorizationHeader = Boolean(getHeaderValue(event.headers || {}, "authorization"));

  try {
    const tokenClaims = hasAuthorizationHeader
      ? (jwtAuthService.verifyAccessToken(
          extractBearerToken(event.headers || {})
        ) as VerifiedAccessClaims)
      : undefined;

    return await runWithAuthContext(buildAuthContextFromClaims(tokenClaims), async () => {
      const apiHandler = extractRouteHandler(apiHandlers, routeKey);

      console.log("Handling API request", {
        method: httpMethod,
        path,
        routeKey,
        requestId,
        hasAuthorizationHeader,
      });

      if (!apiHandler) {
        console.log(`BAD ROUTE: ${routeKey} is not a valid route!`);
        return {
          statusCode: StatusCode.BAD_GATEWAY,
          body: JSON.stringify({ message: `${routeKey} is not a valid route!` }),
          headers: API_HEADERS,
        };
      }
      const dbName = getDbName(event);
      await connectToDB(dbName);

      const isProtectedRoute = apiHandler.access !== "public";
      const hasMiddleWares = apiHandler.middlewares && apiHandler.middlewares.length > 0;

      if (isProtectedRoute) {
        await enforceRequestUserAccess(event, apiHandler.access);
        updateAuthContext(buildAuthContextFromUser(event));
      }

      if (hasMiddleWares) {
        console.log("Running middlewares");
        await runMiddlewares(apiHandler.middlewares!, event, context);
      }

      if (apiValidators && apiValidators[routeKey]) {
        console.log("Performing validations");
        const validatorFunction = apiValidators[routeKey];
        const validationResult = await validatorFunction(event, context);

        console.log("Validation result: ", validationResult);

        if (!validationResult.isValid) {
          console.log("JOI Validation middleware failed:", validationResult.message);
          return {
            ...createResponse(StatusCode.BAD_REQUEST, validationResult.message),
            headers: API_HEADERS,
          };
        }
      }

      const response = await apiHandler.handler(event, context);
      const apiResponse = {
        ...response,
        headers: {
          ...response?.headers,
          ...API_HEADERS,
        },
      };
      console.log("api response", apiResponse);

      return apiResponse;
    });
  } catch (error) {
    console.error("Error in Lambda handler", {
      method: httpMethod,
      path,
      routeKey,
      requestId,
      hasAuthorizationHeader,
      statusCode: isHttpError(error) ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR,
      message:
        error instanceof Error ? error.message : isHttpError(error) ? error.message : String(error),
    });

    if (isHttpError(error)) {
      return {
        statusCode: error.statusCode,
        body: JSON.stringify({ message: error.message }),
        headers: API_HEADERS,
      };
    }

    return {
      statusCode: StatusCode.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({
        message: `There was an error with the request:\n\n\n Error:${error}`,
      }),
      headers: API_HEADERS,
    };
  }
};
