import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import connectToDB from "../db/connect";
import { createResponse } from "../utils/utils";
import { API_HEADERS } from "../constants/Constants";

export type ApiHandlers = {
  [key: string]: Function;
};

export const handleApiCall = async (
  event: APIGatewayProxyEvent,
  context: Context,
  apiHandlers: ApiHandlers,
  apiValidators?: ApiHandlers
): Promise<APIGatewayProxyResult> => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const { httpMethod, path } = event;
    const routeKey = `${httpMethod} ${path}` as keyof typeof apiHandlers;
    const handlerFunction = apiHandlers[routeKey];

    console.log("event", JSON.stringify(event));

    if (!handlerFunction) {
      return {
        statusCode: StatusCode.BAD_GATEWAY,
        body: JSON.stringify({ message: `${routeKey} is not a valid route!` }),
        headers: API_HEADERS,
      };
    }
    await connectToDB();

    if (apiValidators && apiValidators[routeKey]) {
      const validatorFunction = apiValidators[routeKey];
      const validationResult = await validatorFunction(event, context);

      if (!validationResult.isValid) {
        return {
          ...createResponse(StatusCode.BAD_REQUEST, validationResult.message),
          headers: API_HEADERS,
        };
      }
    }

    const response = await handlerFunction(event, context);
    const apiResponse = {
      ...response,
      headers: {
        ...response?.headers,
        ...API_HEADERS,
      },
    };
    console.log("api response", apiResponse);

    return apiResponse;
  } catch (error) {
    console.error("Error in Lambda handler", error);
    return {
      statusCode: StatusCode.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({
        message: `There was an error with the request:\n\n\n Error:${error}`,
      }),
      headers: API_HEADERS,
    };
  }
};
