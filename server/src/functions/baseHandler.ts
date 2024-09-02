import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import connect from "../db/connect";

type ApiHandlers = {
  [key: string]: Function;
};

export const handleApiCall = async (
  event: APIGatewayProxyEvent,
  context: Context,
  apiHandlers: ApiHandlers
): Promise<APIGatewayProxyResult> => {
  context.callbackWaitsForEmptyEventLoop = false;

  // Validate the request method and path
  try {
    console.log("event", JSON.stringify(event));
    const { httpMethod, path } = event;

    // Build the route key for userApiHandlers
    const routeKey = `${httpMethod} ${path}` as keyof typeof apiHandlers;

    // Identify the matching route from userApiHandlers
    const handlerFunction = apiHandlers[routeKey];

    if (!handlerFunction) {
      return {
        statusCode: StatusCode.NOT_FOUND,
        body: JSON.stringify({ message: "Route not found" }),
      };
    }
    await connect(); // Ensure the database is connected
    console.log("Connected to database!");

    // Run the matched handler function
    return await handlerFunction(event, context);
  } catch (error) {
    console.error("Error in Lambda handler", error);
    return {
      statusCode: StatusCode.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({ message: error }),
    };
  }
};
