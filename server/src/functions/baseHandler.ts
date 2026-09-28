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
import { User } from "../models/userModel";
import { IUser } from "../interfaces/IUser";

type VerifiedAccessClaims = AccessClaims & {
  trainerId?: string;
  subTrainerId?: string;
};

const jwtAuthService = new JwtAuthService();
const NEW_ACCESS_TOKEN_HEADER = "x-new-access-token";
const LOG_CHUNK_SIZE = 48_000;
const MAX_LOG_DEPTH = 64;
const REDACTED_LOG_VALUE = "[REDACTED]";
const MAX_LOG_DEPTH_VALUE = "[MAX LOG DEPTH]";
const SENSITIVE_LOG_KEYS = new Set([
  "authorization",
  "cookie",
  "setcookie",
  "password",
  "confirmpassword",
  "apppassword",
  "accesstoken",
  "refreshtoken",
  "xnewaccesstoken",
  "secret",
  "secretkey",
  "token",
  "jwt",
]);

const normalizeLogKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, "");

const isSensitiveLogKey = (key: string) => {
  const normalizedKey = normalizeLogKey(key);

  return (
    SENSITIVE_LOG_KEYS.has(normalizedKey) ||
    normalizedKey.endsWith("authorization") ||
    normalizedKey.includes("password") ||
    normalizedKey.endsWith("accesskey") ||
    normalizedKey.endsWith("accesskeyid") ||
    normalizedKey.endsWith("token") ||
    normalizedKey.endsWith("tokenhash") ||
    normalizedKey.endsWith("secret") ||
    normalizedKey.endsWith("apikey") ||
    normalizedKey.endsWith("privatekey")
  );
};

const redactLogValue = (
  value: unknown,
  key?: string,
  seen = new WeakSet<object>(),
  depth = 0
): unknown => {
  if (key && isSensitiveLogKey(key)) {
    return REDACTED_LOG_VALUE;
  }

  if (typeof value === "string" && key === "body") {
    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(value);
    } catch {
      return "[NON-JSON BODY REDACTED]";
    }

    return redactLogValue(parsedBody, undefined, seen, depth + 1);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (depth >= MAX_LOG_DEPTH) {
    return MAX_LOG_DEPTH_VALUE;
  }

  if (seen.has(value)) {
    return "[CIRCULAR]";
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactLogValue(item, undefined, seen, depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value).map(([entryKey, entryValue]) => [
      entryKey,
      redactLogValue(entryValue, entryKey, seen, depth + 1),
    ])
  );
};

const logLargePayload = (label: string, payload: unknown) => {
  let serialized: string;
  try {
    serialized = JSON.stringify(redactLogValue(payload));
  } catch {
    serialized = JSON.stringify("[LOG REDACTION FAILED]");
  }
  const totalParts = Math.max(1, Math.ceil(serialized.length / LOG_CHUNK_SIZE));

  for (let index = 0; index < totalParts; index += 1) {
    const chunk = serialized.slice(index * LOG_CHUNK_SIZE, (index + 1) * LOG_CHUNK_SIZE);
    console.log(`${label} [${index + 1}/${totalParts}] ${chunk}`);
  }
};

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

      logLargePayload("Handling API request", {
        headers: event.headers,
        params: event.pathParameters,
        query: event.queryStringParameters,
        body: event.body,
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
        const middlewareResult = await runMiddlewares(apiHandler.middlewares!, event, context);

        if (!middlewareResult.isValid) {
          return {
            ...createResponse(StatusCode.BAD_REQUEST, middlewareResult.message),
            headers: API_HEADERS,
          };
        }
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
      const renewedAccessToken =
        tokenClaims && response.statusCode >= 200 && response.statusCode < 300
          ? await jwtAuthService.getRenewedAccessToken(
              tokenClaims,
              (event.authUser as IUser | undefined) ?? null
            )
          : null;
      const apiResponse = {
        ...response,
        headers: {
          ...response?.headers,
          ...API_HEADERS,
          ...(renewedAccessToken ? { [NEW_ACCESS_TOKEN_HEADER]: renewedAccessToken } : {}),
        },
      };
      logLargePayload("API response", apiResponse);

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
