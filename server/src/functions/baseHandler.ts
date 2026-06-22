import { Context, APIGatewayProxyResult } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import connectToDB from "../db/connect";
import {
  createResponse,
  extractBearerToken,
  getHeaderValue,
  removeSensitiveInfoFromLog,
} from "../utils/utils";
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
import { User } from "../models/userModel";
import { IUser } from "../interfaces/IUser";

type VerifiedAccessClaims = AccessClaims & {
  trainerId?: string;
  subTrainerId?: string;
};

const jwtAuthService = new JwtAuthService();

const buildAuthContextFromClaims = (claims?: VerifiedAccessClaims) => {
  console.log("Building auth context from claims:", claims);
  if (!claims) {
    return {};
  }
  const isAdmin = claims.role === "admin";
  const trainerId = claims.trainerId;

  return {
    userId: claims.userId,
    trainerId: trainerId ? trainerId : isAdmin ? claims.userId : undefined,
    role: claims.role,
  };
};

const buildAuthContextFromUser = (user: IUser | null) => {
  if (!user) {
    console.log("No user provided to buildAuthContextFromUser, returning empty auth context.");
    return {};
  }

  console.log("Building auth context from user:", user);
  return {
    userId: user._id?.toString(),
    trainerId: user.trainerId?.toString(),
    role: user.role,
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

    const authContext = buildAuthContextFromClaims(tokenClaims);

    return await runWithAuthContext(authContext, async () => {
      const apiHandler = extractRouteHandler(apiHandlers, routeKey);

      console.log("Handling API request", {
        headers: removeSensitiveInfoFromLog(event.headers),
        params: removeSensitiveInfoFromLog(event.pathParameters),
        query: removeSensitiveInfoFromLog(event.queryStringParameters),
        body: removeSensitiveInfoFromLog(event.body),
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

      if (isProtectedRoute || hasAuthorizationHeader) {
        const user = await enforceRequestUserAccess(event, apiHandler.access);
        updateAuthContext(buildAuthContextFromUser(user));
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
      console.log("API response", removeSensitiveInfoFromLog(apiResponse));

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
        body: JSON.stringify({
          message: error.message,
          ...(error.code ? { code: error.code } : {}),
        }),
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
