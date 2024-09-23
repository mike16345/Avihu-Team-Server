import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { menuItemShcemaValidation } from "../models/menuItemModel";
import { MenuItemService } from "../services/menuItemServices";
import { createValidatorResponse, validateBody } from "../utils/utils";

export const validateMenuItem = async (event: APIGatewayProxyEvent, context: Context) => {
  const menuItem = JSON.parse(event.body || "{}");
  const { id } = event.queryStringParameters || {};

  try {
    if (!id) {
      const menuItemExists = await MenuItemService.getOneMenuItemByName(menuItem.name);
      if (menuItemExists) {
        return createValidatorResponse(false, "פריט כבר קיים במערכת"); // Item already exists in the system
      }
    }
  } catch (err: any) {
    return createValidatorResponse(false, err.message);
  }

  return validateBody(event, menuItemShcemaValidation);
};
