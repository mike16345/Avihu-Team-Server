import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { IDietV2CatalogItem } from "../interfaces/IDietV2CatalogItem";
import { DietV2CatalogCategory } from "../interfaces/IDietPlanV2";
import { DietV2CatalogService } from "../services/dietV2CatalogService";
import { StatusCode } from "../enums/StatusCode";
import { extractBodyFromEvent } from "../utils/utils";
import BaseController from "./BaseController";

export class DietV2CatalogController extends BaseController<
  IDietV2CatalogItem,
  DietV2CatalogService
> {
  constructor() {
    super(new DietV2CatalogService());
  }

  getPopular = async (): Promise<APIGatewayProxyResult> => {
    try {
      const data = await this.service.getPopular();

      return this.successResponse({
        status: StatusCode.OK,
        data,
        message: "Popular diet catalog items retrieved successfully!",
      });
    } catch (error) {
      return this.errorResponse(error);
    }
  };

  search = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const category = event.queryStringParameters?.category as DietV2CatalogCategory;
    const query = event.queryStringParameters?.q ?? "";

    try {
      const data = await this.service.search(category, query);

      return this.successResponse({
        status: StatusCode.OK,
        data,
        message: "Diet catalog items retrieved successfully!",
      });
    } catch (error) {
      return this.errorResponse(error);
    }
  };

  deleteItem = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const id = event.queryStringParameters?.id ?? "";

    try {
      const data = await this.service.deleteItem(id);

      return this.successResponse({
        status: StatusCode.OK,
        data,
        message: "Diet catalog item deleted successfully!",
      });
    } catch (error) {
      return this.errorResponse(error);
    }
  };

  updateItem = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const id = event.queryStringParameters?.id ?? "";

    try {
      const data = await this.service.updateItem(id, extractBodyFromEvent(event).name);
      return this.successResponse({
        status: StatusCode.OK,
        data,
        message: "Diet catalog item updated successfully!",
      });
    } catch (error) {
      return this.errorResponse(error);
    }
  };
}
