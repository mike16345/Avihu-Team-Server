import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { FoodCatalogController } from "../../controllers/FoodCatalogController";
import {
  validateFoodCatalogItemId,
  validateFoodCatalogLookup,
  validateFoodCatalogOverride,
} from "../../middleware/foodCatalogMiddleware";
import { ApiRouteHandlers } from "../../types/lambdaTypes";
import { handleApiCall } from "../baseHandler";

const BASE_PATH = "/foodCatalog";
const controller = new FoodCatalogController();

export const foodCatalogApiRoutes: ApiRouteHandlers = {
  [`GET ${BASE_PATH}/barcode`]: {
    handler: controller.lookupBarcode,
    access: "authenticated",
    middlewares: [validateFoodCatalogLookup],
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
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => handleApiCall(event, context, foodCatalogApiRoutes);
