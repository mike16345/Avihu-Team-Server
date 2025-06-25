import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { menuItemShcemaValidation } from "../models/menuItemModel";
import { MenuItemService } from "../services/menuItemServices";
import { createValidatorResponse, validateBody } from "../utils/utils";
import { FIND_ONE_FAILURE } from "../constants/repository";

const menuItemService = new MenuItemService();

export const validateMenuItem = async (event: APIGatewayProxyEvent, context: Context) => {
  const menuItem = JSON.parse(event.body || "{}");
  const { id } = event.queryStringParameters || {};

  try {
    if (!id) {
      const menuItemExists = await menuItemService.findOne({ name: menuItem.name });
      if (menuItemExists) {
        return createValidatorResponse(false, "פריט כבר קיים במערכת"); // Item already exists in the system
      }
    }
  } catch (err: any) {
    if (err.message !== FIND_ONE_FAILURE) {
      return createValidatorResponse(false, err.message);
    }
  }

  return validateBody(event, menuItemShcemaValidation);
};
