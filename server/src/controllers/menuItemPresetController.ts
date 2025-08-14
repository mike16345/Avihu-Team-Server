import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import { MenuItemService } from "../services/menuItemServices";
import { createResponseWithData, createServerErrorResponse } from "../utils/utils";
import BaseController from "./BaseController";
import { ICustomItemInstructions } from "../interfaces/IDietPlan";

export class MenuItemPresetController extends BaseController<
  ICustomItemInstructions,
  MenuItemService
> {
  constructor() {
    super(new MenuItemService());
  }

  getMenuItems = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { foodGroup } = event.queryStringParameters || {};
    const { "dietaryRestrictions[]": dietaryRestrictions } =
      event.multiValueQueryStringParameters || {};

    const dietaryRestrictionsArray = dietaryRestrictions
      ? dietaryRestrictions.map((str) => decodeURIComponent(str))
      : null;

    try {
      const menuItems = await this.service.getMenuItems(foodGroup || "", dietaryRestrictionsArray);

      return createResponseWithData(StatusCode.OK, menuItems, "Menu items retrieved successfully!");
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  };

  getAllMenuItems = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const { dietaryTypes } = this.getParamsOrError(event, ["dietaryTypes"], "body");
      const allMenuItems = await this.service.getAllMenuItems(dietaryTypes);

      return createResponseWithData(
        StatusCode.OK,
        allMenuItems,
        "All menu items retrieved successfully!"
      );
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  };
}
