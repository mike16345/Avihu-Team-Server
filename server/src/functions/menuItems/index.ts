import { MenuItemPresetController } from "../../controllers/menuItemPresetController";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { validateMenuItem } from "../../middleware/menuItemMiddleware";

const BASE_PATH = "/menuItems";

const menuItemPresetController= new MenuItemPresetController()

const menuItemApiHandlers = {
  [`GET ${BASE_PATH}`]: menuItemPresetController.getAllMenuItems,
  [`GET ${BASE_PATH}/one`]: menuItemPresetController.getById,
  [`GET ${BASE_PATH}/foodGroup`]: menuItemPresetController.getMenuItems,
  [`PUT ${BASE_PATH}/one`]: menuItemPresetController.updateById,
  [`POST ${BASE_PATH}`]: menuItemPresetController.create,
  [`DELETE ${BASE_PATH}/one`]: menuItemPresetController.deleteById,
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
