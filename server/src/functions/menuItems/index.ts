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
    access: "public",
  },
  [`GET ${BASE_PATH}/one`]: {
    handler: menuItemPresetController.getById,
    access: "public",
  },
  [`GET ${BASE_PATH}/foodGroup`]: {
    handler: menuItemPresetController.getMenuItems,
    access: "public",
  },
  [`PUT ${BASE_PATH}/one`]: {
    handler: menuItemPresetController.updateById,
    access: "trainerOrAdmin",
    middlewares: [validateMenuItem],
  },
  [`POST ${BASE_PATH}`]: {
    handler: menuItemPresetController.create,
    access: "trainerOrAdmin",
    middlewares: [validateMenuItem],
  },
  [`DELETE ${BASE_PATH}/one`]: {
    handler: menuItemPresetController.deleteById,
    access: "trainerOrAdmin",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, menuItemApiRoutes);
};
