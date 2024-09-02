import connect from "../../db/connect"; // Assuming you have a separate module for the DB connection
import { StatusCode } from "../../enums/StatusCode";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import WeighInsController from "../../controllers/weighInsController";
import { handleApiCall } from "../baseHandler";
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
  return await handleApiCall(event, context, weighInApiHandlers);
};
