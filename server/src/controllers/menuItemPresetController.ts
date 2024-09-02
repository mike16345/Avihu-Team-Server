import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import { menuItemServices } from "../services/menuItemServices";

export class MenuItemPresetController {
  static async addMenuItem(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const menuItem = JSON.parse(event.body || "{}");

    try {
      const newMenuItem = await menuItemServices.addMenuItem(menuItem);
      return {
        statusCode: StatusCode.CREATED,
        body: JSON.stringify({
          message: "Menu item added successfully!",
          data: newMenuItem,
        }),
      };
    } catch (error: any) {
      return {
        statusCode: StatusCode.INTERNAL_SERVER_ERROR,
        body: JSON.stringify({
          message: "An error occurred while adding the menu item.",
          error: error.message,
        }),
      };
    }
  }

  static async getMenuItems(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const { foodGroup } = event.pathParameters || {};

    try {
      const menuItems = await menuItemServices.getMenuItems(foodGroup || "");
      return {
        statusCode: StatusCode.OK,
        body: JSON.stringify({
          message: "Menu items retrieved successfully!",
          data: menuItems,
        }),
      };
    } catch (error: any) {
      return {
        statusCode: StatusCode.INTERNAL_SERVER_ERROR,
        body: JSON.stringify({
          message: "An error occurred while retrieving the menu items.",
          error: error.message,
        }),
      };
    }
  }

  static async getOneMenuItem(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const { id } = event.queryStringParameters || {};

    try {
      const menuItem = await menuItemServices.getOneMenuItem(id || "");
      return {
        statusCode: StatusCode.OK,
        body: JSON.stringify({
          message: "Menu item retrieved successfully!",
          data: menuItem,
        }),
      };
    } catch (error: any) {
      return {
        statusCode: StatusCode.INTERNAL_SERVER_ERROR,
        body: JSON.stringify({
          message: "An error occurred while retrieving the menu item.",
          error: error.message,
        }),
      };
    }
  }

  static async getAllMenuItems(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    try {
      const allMenuItems = await menuItemServices.getAllMenuItems();
      return {
        statusCode: StatusCode.OK,
        body: JSON.stringify({
          message: "All menu items retrieved successfully!",
          data: allMenuItems,
        }),
      };
    } catch (error: any) {
      return {
        statusCode: StatusCode.INTERNAL_SERVER_ERROR,
        body: JSON.stringify({
          message: "An error occurred while retrieving all menu items.",
          error: error.message,
        }),
      };
    }
  }

  static async editMenuItem(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const newMenuItem = JSON.parse(event.body || "{}");
    const { id } = event.queryStringParameters || {};

    try {
      const updatedMenuItem = await menuItemServices.updateMenuItem(newMenuItem, id || "");
      return {
        statusCode: StatusCode.OK,
        body: JSON.stringify({
          message: "Menu item updated successfully!",
          data: updatedMenuItem,
        }),
      };
    } catch (error: any) {
      return {
        statusCode: StatusCode.INTERNAL_SERVER_ERROR,
        body: JSON.stringify({
          message: "An error occurred while updating the menu item.",
          error: error.message,
        }),
      };
    }
  }

  static async deleteMenuItem(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const { id } = event.queryStringParameters || {};

    try {
      const deletedMenuItem = await menuItemServices.deleteMenuItem(id || "");
      return {
        statusCode: StatusCode.OK,
        body: JSON.stringify({
          message: "Menu item deleted successfully!",
          data: deletedMenuItem,
        }),
      };
    } catch (error: any) {
      return {
        statusCode: StatusCode.INTERNAL_SERVER_ERROR,
        body: JSON.stringify({
          message: "An error occurred while deleting the menu item.",
          error: error.message,
        }),
      };
    }
  }
}

export const menuItemController = new MenuItemPresetController();
