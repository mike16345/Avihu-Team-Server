import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { FoodCatalogController } from "../../controllers/FoodCatalogController";
import {
  validateFoodCatalogItemId,
  validateFoodCatalogLookup,
  validateFoodCatalogOverride,
  validateFoodCatalogSearch,
  validateManualFoodCatalogItem,
  validateManualFoodCatalogItemUpdate,
} from "../../middleware/foodCatalogMiddleware";
import { ApiRouteHandlers } from "../../types/lambdaTypes";
import { handleApiCall } from "../baseHandler";

const BASE_PATH = "/foodCatalog";
const controller = new FoodCatalogController();

export const foodCatalogApiRoutes: ApiRouteHandlers = {
  [`GET ${BASE_PATH}/item`]: {
    handler: controller.lookupItem,
    access: "authenticated",
    middlewares: [validateFoodCatalogItemId],
  },
  [`GET ${BASE_PATH}/barcode`]: {
    handler: controller.lookupBarcode,
    access: "authenticated",
    middlewares: [validateFoodCatalogLookup],
  },
  [`GET ${BASE_PATH}/search`]: {
    handler: controller.search,
    access: "authenticated",
    middlewares: [validateFoodCatalogSearch],
  },
  [`POST ${BASE_PATH}/consumption`]: {
    handler: controller.reportConsumption,
    access: "authenticated",
    middlewares: [validateFoodCatalogItemId],
  },
  [`PATCH ${BASE_PATH}/admin-overrides`]: {
    handler: controller.applyAdminOverrides,
    access: "admin",
    middlewares: [validateFoodCatalogOverride],
  },
  [`DELETE ${BASE_PATH}/admin-overrides`]: {
    handler: controller.clearAdminOverrides,
    access: "admin",
    middlewares: [validateFoodCatalogItemId],
  },
  [`POST ${BASE_PATH}/admin/items`]: {
    handler: controller.createManualItem,
    access: "admin",
    middlewares: [validateManualFoodCatalogItem],
  },
  [`PUT ${BASE_PATH}/admin/items`]: {
    handler: controller.updateAdminItem,
    access: "admin",
    middlewares: [validateManualFoodCatalogItemUpdate],
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => handleApiCall(event, context, foodCatalogApiRoutes);
