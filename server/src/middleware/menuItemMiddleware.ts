import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { fullMenuItemPresets, menuItemShcemaValidation } from "../models/menuItemModel";
import { StatusCode } from "../enums/StatusCode";

export const validateMenuItem = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<{ isValid: boolean; message?: string; validatedMenuItem?: any }> => {
  const menuItem = JSON.parse(event.body || "{}");
  const { id } = event.pathParameters || {};

  try {
    if (!id) {
      const menuItemExists = await fullMenuItemPresets.findOne({ name: menuItem.name });
      if (menuItemExists) {
        return { isValid: false, message: "פריט כבר קיים במערכת" }; // Item already exists in the system
      }
    }

    delete menuItem.oneServing?._id;
    delete menuItem._id;
    delete menuItem.__v;

    const { error } = menuItemShcemaValidation.validate(menuItem);

    if (error) {
      return { isValid: false, message: error.message };
    }

    // Validation passed
    return { isValid: true, validatedMenuItem: menuItem };
  } catch (err: any) {
    return { isValid: false, message: "An error occurred during validation" };
  }
};
