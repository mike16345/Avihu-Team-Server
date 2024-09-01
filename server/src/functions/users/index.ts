import connect from "../../db/connect"; // Assuming you have a separate module for the DB connection
import { UserController } from "../../controllers/userController";
import { StatusCode } from "../../enums/StatusCode";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

const BASE_PATH = "/users";
const userApiHandlers = {
  [`GET ${BASE_PATH}`]: UserController.getUsers, // Get all users
  [`GET ${BASE_PATH}/one`]: UserController.getUser, // Get user by ID
  [`GET ${BASE_PATH}/email`]: UserController.getUserByEmail, // Get user by email
  [`PUT ${BASE_PATH}/one`]: UserController.updateUser, // Update user by ID
  [`PUT ${BASE_PATH}/bulk`]: UserController.updateManyUsers, // Update users (bulk)
  [`POST ${BASE_PATH}`]: UserController.addUser, // Add new user
  [`DELETE ${BASE_PATH}/one`]: UserController.deleteUser, // Delete user by ID
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
    const routeKey = `${httpMethod} ${path}` as keyof typeof userApiHandlers;

    // Identify the matching route from userApiHandlers
    const handlerFunction = userApiHandlers[routeKey as keyof typeof userApiHandlers];

    if (!handlerFunction) {
      return {
        statusCode: StatusCode.NOT_FOUND,
        body: JSON.stringify({ message: "Route not found" }),
      };
    }

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
