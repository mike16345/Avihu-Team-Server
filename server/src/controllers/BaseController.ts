import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import { IBaseController } from "../interfaces/IController";
import { BaseService } from "../services/baseService";
import {
  createMissingParamErrorMessage,
  createServerResponse,
  extractBodyFromEvent,
  extractQueryFromEvent,
} from "../utils/utils";
import { IServerResponseParams } from "../interfaces/IResponse";
import { FindOptionsNoQuery } from "../types/mongooseTypes";

type IdOrError = { id: string; error: null } | { id: null; error: APIGatewayProxyResult };

export default class BaseController<T> implements IBaseController<T> {
  protected service: BaseService<T>;

  constructor(service: BaseService<T>) {
    this.service = service;
  }

  /**
   * Hook called before each action. Override for auth, logging, etc.
   */
  protected async beforeAction(event: APIGatewayProxyEvent) {
    // placeholder for subclass overrides
    console.log("Performing action...");
  }

  /**
   * Hook called after each action. Override for postprocessing, logging, etc.
   */
  protected async afterAction(result: APIGatewayProxyResult) {
    // placeholder for subclass overrides
    console.log("Finished Action...");
  }

  /**
   * Extracts `id` from query parameters or returns an error response.
   * This helps reduce repeated error message creation.
   */
  protected getIdOrError(event: APIGatewayProxyEvent): IdOrError {
    const { id } = extractQueryFromEvent(event);

    if (!id) {
      return {
        id: null,
        error: this.errorResponse(createMissingParamErrorMessage("id"), StatusCode.BAD_REQUEST),
      };
    }
    return { id, error: null };
  }

  // ====== CREATE ======
  create = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);
    try {
      const data = extractBodyFromEvent(event);

      if (!data) {
        return this.errorResponse({ message: "Cannot create item with no body!" });
      }

      const item = await this.service.create(data);

      const response = this.successResponse({ data: item });
      await this.afterAction(response);
      return response;
    } catch (e: any) {
      return this.errorResponse(e);
    }
  };

  // ====== READ ======

  getAll = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);
    try {
      const data = await this.service.find();

      const response = this.successResponse({ data, message: "Successfully found items!" });
      await this.afterAction(response);
      return response;
    } catch (e: any) {
      return this.errorResponse(e);
    }
  };

  getById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const { id, error } = this.getIdOrError(event);
      const {query}=extractBodyFromEvent(event);

      if (error) return error;

      const data = await this.service.findById(id,query);
      const response = this.successResponse({
        data,
        message: `Successfully found item with id: "${id}"`,
      });

      await this.afterAction(response);
      return response;
    } catch (e: any) {
      return this.errorResponse(e);
    }
  };

  getOne = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);
    try {
      const query = extractQueryFromEvent(event);
      const item = await this.service.findOne(query);
      const response = this.successResponse({ data: item });

      await this.afterAction(response);

      return response;
    } catch (e: any) {
      return this.errorResponse(e);
    }
  };

  getPaginated = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const query = extractQueryFromEvent(event);
      const results = await this.service.findPaginated(query, "");
      const response = this.successResponse({ data: results });

      await this.afterAction(response);

      return response;
    } catch (e: any) {
      return this.errorResponse(e);
    }
  };

  // ====== UPDATE ======

  update = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const query = extractQueryFromEvent(event);
      const data = extractBodyFromEvent(event);
      const updatedItem = await this.service.updateOne(query, data);
      const response = this.successResponse({ data: updatedItem, message: "פריט עודכן בהצלחה!" });

      await this.afterAction(response);
      return response;
    } catch (e: any) {
      return this.errorResponse(e);
    }
  };

  updateById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const { id, error } = this.getIdOrError(event);

      if (error) return error;
      const data = extractBodyFromEvent(event);
      const updatedItem = await this.service.updateById(id, data);
      const response = this.successResponse({ data: updatedItem, message: "פריט עודכן בהצלחה!" });

      await this.afterAction(response);

      return response;
    } catch (e: any) {
      return this.errorResponse(e);
    }
  };

  updateMany = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const query = extractQueryFromEvent(event);
      const data = extractBodyFromEvent(event);
      const updatedItem = await this.service.updateMany(query, data);
      const response = this.successResponse({
        data: updatedItem,
        message: "פריטים עודכנו בהצלחה!",
      });

      await this.afterAction(response);

      return response;
    } catch (e: any) {
      return this.errorResponse(e);
    }
  };

  // ====== DELETE ======

  delete = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const query = extractQueryFromEvent(event);
      const deletedItem = await this.service.delete(query);
      const response = this.successResponse({ data: deletedItem, message: "פריט נמחק בהצלחה!" });

      await this.afterAction(response);

      return response;
    } catch (e: any) {
      return this.errorResponse(e);
    }
  };

  deleteMany = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const query = extractQueryFromEvent(event);
      const deletedItem = await this.service.deleteMany(query);
      const response = this.successResponse({ data: deletedItem, message: "פריטים נמחקו בהצלחה!" });

      await this.afterAction(response);

      return response;
    } catch (e: any) {
      return this.errorResponse(e);
    }
  };

  deleteById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const { id, error } = this.getIdOrError(event);

      if (error) return error;

      const deletedItem = await this.service.deleteById(id);
      const response = this.successResponse({ data: deletedItem, message: "פריט נמחק בהצלחה!" });

      await this.afterAction(response);

      return response;
    } catch (e: any) {
      return this.errorResponse(e);
    }
  };

  // ====== RESPONSE HELPERS ======

  successResponse(response?: IServerResponseParams): APIGatewayProxyResult {
    return createServerResponse(
      response?.status || StatusCode.OK,
      response?.message,
      response?.data
    );
  }

  errorResponse(
    error: any,
    errorCode: StatusCode = StatusCode.INTERNAL_SERVER_ERROR
  ): APIGatewayProxyResult {
    const errorMessage = error?.message || error || "There was an unknown error!";
    console.error("[BaseController] Error:", errorMessage);

    return createServerResponse(errorCode, errorMessage);
  }
}
