import { MenuItemPresetController } from "../../controllers/menuItemPresetController";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { validateMenuItem } from "../../middleware/menuItemMiddleware";
import { ApiRouteHandlers } from "../../types/lambdaTypes";
import { DietV2CatalogController } from "../../controllers/dietV2CatalogController";
import {
  validateDietV2CatalogDelete,
  validateDietV2CatalogSearch,
} from "../../middleware/dietV2CatalogMiddleware";

const BASE_PATH = "/menuItems";

const menuItemPresetController = new MenuItemPresetController();
const dietV2CatalogController = new DietV2CatalogController();

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
  [`GET ${BASE_PATH}/v2/popular`]: {
    handler: dietV2CatalogController.getPopular,
    access: "subtrainer",
  },
  [`GET ${BASE_PATH}/v2/search`]: {
    handler: dietV2CatalogController.search,
    access: "subtrainer",
    middlewares: [validateDietV2CatalogSearch],
  },
  [`DELETE ${BASE_PATH}/v2/one`]: {
    handler: dietV2CatalogController.deleteItem,
    access: "subtrainer",
    middlewares: [validateDietV2CatalogDelete],
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, menuItemApiRoutes);
};
