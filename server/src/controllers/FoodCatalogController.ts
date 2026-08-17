import { APIGatewayProxyResult } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import { FoodCatalogService } from "../services/foodCatalogService";
import { AppEvent } from "../types/lambdaTypes";
import { createServerResponse, extractBodyFromEvent } from "../utils/utils";

export class FoodCatalogController {
  constructor(private readonly service = new FoodCatalogService()) {}

  private error(error: any): APIGatewayProxyResult {
    return createServerResponse(
      error?.statusCode ?? error?.status ?? StatusCode.INTERNAL_SERVER_ERROR,
      error?.message ?? "There was an unknown error."
    );
  }

  lookupBarcode = async (event: AppEvent): Promise<APIGatewayProxyResult> => {
    try {
      const data = await this.service.lookupBarcode(event.queryStringParameters!.barcode!);
      return createServerResponse(StatusCode.OK, "Food retrieved successfully.", data);
    } catch (error) {
      return this.error(error);
    }
  };

  search = async (event: AppEvent): Promise<APIGatewayProxyResult> => {
    try {
      const query = event.queryStringParameters?.q?.trim() ?? "";
      const data = await this.service.search(query);
      return createServerResponse(StatusCode.OK, "Food catalog searched successfully.", data);
    } catch (error) {
      return this.error(error);
    }
  };

  reportConsumption = async (event: AppEvent): Promise<APIGatewayProxyResult> => {
    try {
      const data = await this.service.reportConsumption(event.queryStringParameters!.id!);
      return createServerResponse(StatusCode.OK, "Food consumption recorded.", data);
    } catch (error) {
      return this.error(error);
    }
  };

  applyAdminOverrides = async (event: AppEvent): Promise<APIGatewayProxyResult> => {
    const adminId = event.authUser?._id?.toString();
    if (!adminId) {
      return createServerResponse(StatusCode.UNAUTHORIZED, "Authenticated Admin is required.");
    }
    try {
      const body = extractBodyFromEvent(event);
      const data = await this.service.applyAdminOverrides(
        event.queryStringParameters!.id!,
        body.overrides,
        adminId,
        body.reason
      );
      return createServerResponse(StatusCode.OK, "Food overrides updated.", data);
    } catch (error) {
      return this.error(error);
    }
  };

  clearAdminOverrides = async (event: AppEvent): Promise<APIGatewayProxyResult> => {
    try {
      const data = await this.service.clearAdminOverrides(event.queryStringParameters!.id!);
      return createServerResponse(StatusCode.OK, "Food overrides cleared.", data);
    } catch (error) {
      return this.error(error);
    }
  };

  createManualItem = async (event: AppEvent): Promise<APIGatewayProxyResult> => {
    try {
      const data = await this.service.createManualItem(extractBodyFromEvent(event));
      return createServerResponse(StatusCode.CREATED, "Food catalog item created.", data);
    } catch (error) {
      return this.error(error);
    }
  };

  updateAdminItem = async (event: AppEvent): Promise<APIGatewayProxyResult> => {
    const adminId = event.authUser?._id?.toString();
    if (!adminId) {
      return createServerResponse(StatusCode.UNAUTHORIZED, "Authenticated Admin is required.");
    }
    try {
      const data = await this.service.updateAdminItem(
        event.queryStringParameters!.id!,
        extractBodyFromEvent(event),
        adminId
      );
      return createServerResponse(StatusCode.OK, "Food catalog item updated.", data);
    } catch (error) {
      return this.error(error);
    }
  };
}
