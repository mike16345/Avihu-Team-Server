import connect from "../../db/connect"; // Assuming you have a separate module for the DB connection
import { StatusCode } from "../../enums/StatusCode";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import WeighInsController from "../../controllers/weighInsController";
const BASE_PATH = "/weighIns/weights";

const weighInApiHandlers = {
  [`GET ${BASE_PATH}/one`]: WeighInsController.getWeighInsById, // Get weigh ins by ID
  [`GET ${BASE_PATH}/user`]: WeighInsController.getWeighInsByUserId, // Get user by ID
  [`PUT ${BASE_PATH}/one`]: WeighInsController.updateWeighIn, // Update user by ID
  [`POST ${BASE_PATH}/bulk`]: WeighInsController.addManyWeighIns, // Update users (bulk)
  [`POST ${BASE_PATH}`]: WeighInsController.addWeighIn, // Add new user
  [`DELETE ${BASE_PATH}/user`]: WeighInsController.deleteUserWeighIns, // Delete user by ID
  [`DELETE ${BASE_PATH}/one`]: WeighInsController.deleteWeighInById, // Delete user by ID
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await connect(); // Ensure the database is connected
    console.log("Connected to database!");
    console.log("event", JSON.stringify(event));

    const { httpMethod, path } = event;

    // Build the route key for userApiHandlers
    const routeKey = `${httpMethod} ${path}` as keyof typeof weighInApiHandlers;

    // Identify the matching route from userApiHandlers
    const handlerFunction = weighInApiHandlers[routeKey];

    if (!handlerFunction) {
      return {
        statusCode: StatusCode.NOT_FOUND,
        body: JSON.stringify({ message: "Route not found" }),
      };
    }

    // Run the matched handler function
    return await handlerFunction(event);
  } catch (error) {
    console.error("Error in Lambda handler", error);
    return {
      statusCode: StatusCode.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({ message: error }),
    };
  }
};
