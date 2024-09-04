import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import connectToDB from "../db/connect";

type ApiHandlers = {
  [key: string]: Function;
};
type apiValidators = {
  [key: string]: Function;
};

export const handleApiCall = async (
  event: APIGatewayProxyEvent,
  context: Context,
  apiHandlers: ApiHandlers,
  apiValidators?: apiValidators
): Promise<APIGatewayProxyResult> => {
  context.callbackWaitsForEmptyEventLoop = false;
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "*", // Allow any method
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Validate the request method and path
  try {
    console.log("event", JSON.stringify(event));
    const { httpMethod, path } = event;

    // Build the route key for api handlers
    const routeKey = `${httpMethod} ${path}` as keyof typeof apiHandlers;

    if (apiValidators && apiValidators[routeKey]) {
      const validatorFunction = apiValidators[routeKey];

      const validationResult = await validatorFunction(event, context);

      if (!validationResult.isValid) {
        return {
          statusCode: StatusCode.BAD_REQUEST,
          body: JSON.stringify({ message: validationResult.message }),
        };
      }
    }

    // Identify the matching route from userApiHandlers
    const handlerFunction = apiHandlers[routeKey];

    if (!handlerFunction) {
      return {
        statusCode: StatusCode.NOT_FOUND,
        body: JSON.stringify({ message: "Route not found" }),
        headers,
      };
    }
    await connectToDB();

    const response = await handlerFunction(event, context);
    const apiResponse = {
      ...response,
      headers: {
        ...response?.headers,
        ...headers,
      },
    };
    console.log("api response", apiResponse);

    return apiResponse;
  } catch (error) {
    console.error("Error in Lambda handler", error);
    return {
      statusCode: StatusCode.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({ message: error }),
    };
  }
};
