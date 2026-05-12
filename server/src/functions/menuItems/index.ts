import { MenuItemPresetController } from "../../controllers/menuItemPresetController";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { validateMenuItem } from "../../middleware/menuItemMiddleware";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

const BASE_PATH = "/menuItems";

const menuItemPresetController = new MenuItemPresetController();

const menuItemApiRoutes: ApiRouteHandlers = {
  [`GET ${BASE_PATH}`]: {
    handler: menuItemPresetController.getAllMenuItems,
    access: "authenticated",
  },
  [`GET ${BASE_PATH}/one`]: {
    handler: menuItemPresetController.getById,
    access: "authenticated",
  },
  [`GET ${BASE_PATH}/foodGroup`]: {
    handler: menuItemPresetController.getMenuItems,
    access: "authenticated",
  },
  [`PUT ${BASE_PATH}/one`]: {
    handler: menuItemPresetController.updateById,
    access: "subtrainer",
    middlewares: [validateMenuItem],
  },
  [`POST ${BASE_PATH}`]: {
    handler: menuItemPresetController.create,
    access: "subtrainer",
    middlewares: [validateMenuItem],
  },
  [`DELETE ${BASE_PATH}/one`]: {
    handler: menuItemPresetController.deleteById,
    access: "subtrainer",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, menuItemApiRoutes);
};
