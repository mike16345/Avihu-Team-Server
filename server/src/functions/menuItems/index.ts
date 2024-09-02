import { MenuItemPresetController } from "../../controllers/menuItemPresetController";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { validateMenuItem } from "../../middleware/menuItemMiddleware";

const BASE_PATH = "/users";
const menuItemApiHandlers = {
  [`GET ${BASE_PATH}`]: MenuItemPresetController.getAllMenuItems,
  [`GET ${BASE_PATH}/one`]: MenuItemPresetController.getOneMenuItem,
  [`GET ${BASE_PATH}/foodGroup`]: MenuItemPresetController.getMenuItems,
  [`PUT ${BASE_PATH}/one`]: MenuItemPresetController.editMenuItem,
  [`POST ${BASE_PATH}`]: MenuItemPresetController.addMenuItem,
  [`DELETE ${BASE_PATH}/one`]: MenuItemPresetController.deleteMenuItem,
};
const menuItemValidators = {
  [`PUT ${BASE_PATH}/one`]: validateMenuItem,
  [`POST ${BASE_PATH}`]: validateMenuItem,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, menuItemApiHandlers, menuItemValidators);
};
