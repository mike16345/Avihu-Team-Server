import connect from "../../db/connect"; // Assuming you have a separate module for the DB connection
import { UserController } from "../../controllers/userController";
import { StatusCode } from "../../enums/StatusCode";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";

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
  return await handleApiCall(event, context, userApiHandlers);
};
