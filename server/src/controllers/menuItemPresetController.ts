import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import { MenuItemService } from "../services/menuItemServices";
import { createResponse, createResponseWithData, createServerErrorResponse } from "../utils/utils";

export class MenuItemPresetController {
  static async addMenuItem(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const menuItem = JSON.parse(event.body || "{}");

    try {
      const newMenuItem = await MenuItemService.addMenuItem(menuItem);

      return createResponseWithData(
        StatusCode.CREATED,
        newMenuItem,
        "Menu item added successfully!"
      );
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }

  static async getMenuItems(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const { foodGroup } = event.queryStringParameters || {};

    try {
      const menuItems = await MenuItemService.getMenuItems(foodGroup || "");

      if (!menuItems) {
        return createResponse(
          StatusCode.NOT_FOUND,
          "Could not find menu items that match requested food group!"
        );
      }

      return createResponseWithData(StatusCode.OK, menuItems, "Menu items retrieved successfully!");
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }

  static async getOneMenuItem(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const { id } = event.queryStringParameters || {};

    try {
      const menuItem = await MenuItemService.getOneMenuItem(id || "");

      if (!menuItem) {
        return createResponse(StatusCode.NOT_FOUND, `Menu item not found!`);
      }

      return createResponseWithData(StatusCode.OK, menuItem, "Menu item retrieved successfully!");
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }

  static async getAllMenuItems(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    try {
      const allMenuItems = await MenuItemService.getAllMenuItems();

      if (!allMenuItems) {
        return createResponse(StatusCode.NOT_FOUND, `Could not find menu items!`);
      }

      return createResponseWithData(
        StatusCode.OK,
        allMenuItems,
        "All menu items retrieved successfully!"
      );
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }

  static async editMenuItem(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const newMenuItem = JSON.parse(event.body || "{}");
    const { id } = event.queryStringParameters || {};

    try {
      const updatedMenuItem = await MenuItemService.updateMenuItem(newMenuItem, id || "");

      if (!updatedMenuItem) {
        return createResponse(
          StatusCode.NOT_FOUND,
          `Could not find the menu item you are trying to update!`
        );
      }

      return createResponseWithData(
        StatusCode.OK,
        updatedMenuItem,
        "Menu item updated successfully!"
      );
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }

  static async deleteMenuItem(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const { id } = event.queryStringParameters || {};

    try {
      const deletedMenuItem = await MenuItemService.deleteMenuItem(id || "");

      if (!deletedMenuItem) {
        return createResponse(
          StatusCode.NOT_FOUND,
          `Could not find the menu item you are trying to delete!`
        );
      }

      return createResponseWithData(
        StatusCode.OK,
        deletedMenuItem,
        "Menu item deleted successfully!"
      );
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }
}
