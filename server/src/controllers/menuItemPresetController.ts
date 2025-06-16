import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import { MenuItemService } from "../services/menuItemServices";
import {  createResponseWithData, createServerErrorResponse } from "../utils/utils";
import BaseController from "./BaseController";
import { ICustomItemInstructions } from "../interfaces/IDietPlan";

const menuItemService= new MenuItemService()

export class MenuItemPresetController extends BaseController<ICustomItemInstructions> {
  constructor(){
    super(new MenuItemService())
  }


   async getMenuItems(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    const { foodGroup } = event.queryStringParameters || {};
    const { "dietaryRestrictions[]": dietaryRestrictions } =
      event.multiValueQueryStringParameters || {};

    const dietaryRestrictionsArray = dietaryRestrictions
      ? dietaryRestrictions.map((str) => decodeURIComponent(str))
      : null;

    try {
      const menuItems = await menuItemService.getMenuItems(
        foodGroup || "",
        dietaryRestrictionsArray
      );


      return createResponseWithData(StatusCode.OK, menuItems, "Menu items retrieved successfully!");
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }

  

   async getAllMenuItems(): Promise<APIGatewayProxyResult> {
    try {
      const allMenuItems = await menuItemService.getAllMenuItems();

      return createResponseWithData(
        StatusCode.OK,
        allMenuItems,
        "All menu items retrieved successfully!"
      );
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }

  
}
