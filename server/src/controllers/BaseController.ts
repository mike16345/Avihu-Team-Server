import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import { IBaseController } from "../interfaces/IController";
import {
  createMissingParamErrorMessage,
  createServerResponse,
  extractBodyFromEvent,
  extractPaginationParamsFromEvent,
  extractQueryFromEvent,
} from "../utils/utils";
import { IServerResponseParams } from "../interfaces/IResponse";
import { BaseRepository } from "../repositories/BaseRepository";
import { MongoCode } from "../enums/MongoCode";
import { DUPLICATE_PRESET_ERROR } from "../constants/Constants";
import { BaseService } from "../services/baseService";

export default class BaseController<
  T,
  S extends BaseService<T, BaseRepository<T>>,
> implements IBaseController<T> {
  protected service: S;

  constructor(service: S) {
    this.service = service;
  }

  /**
   * Hook called before each action. Override for auth, logging, etc.
   */
  protected async beforeAction(event: APIGatewayProxyEvent) {
    // placeholder for subclass overrides
  }

  /**
   * Hook called after each action. Override for postprocessing, logging, etc.
   */
  protected async afterAction(result: APIGatewayProxyResult) {
    // placeholder for subclass overrides
  }

  protected getParamsOrError(
    event: APIGatewayProxyEvent,
    params: string[],
    extractor: "query" | "body" = "query"
  ) {
    const query = extractor === "body" ? extractBodyFromEvent(event) : extractQueryFromEvent(event);
    const missingParams = params.filter((param) => {
      return query[param] === undefined;
    });

    if (missingParams.length == 0) return { ...query, error: null };

    return {
      error: this.errorResponse(
        createMissingParamErrorMessage(missingParams),
        StatusCode.BAD_REQUEST
      ),
    };
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
      if (e?.code == MongoCode.DUPLICATE_KEY) {
        e.message = DUPLICATE_PRESET_ERROR;
      }

      return this.errorResponse(e);
    }
  };

  // ====== READ ======

  getAll = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    const query = extractQueryFromEvent(event);
    try {
      const data = await this.service.find(query);
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
      const { id, error } = this.getParamsOrError(event, ["id"]);

      if (error) return error;

      const data = await this.service.findById(id);
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
      const query = extractPaginationParamsFromEvent(event);
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
      const { id, error } = this.getParamsOrError(event, ["id"]);

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
      const { id, error } = this.getParamsOrError(event, ["id"]);

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

  errorResponse(error: any, errorCode?: StatusCode, responseCode?: string): APIGatewayProxyResult {
    const errorMessage = error?.message || error || "There was an unknown error!";
    const statusCode =
      errorCode || error?.statusCode || error?.status || StatusCode.INTERNAL_SERVER_ERROR;
    const errorResponseCode = responseCode || error?.code;
    console.error("[BaseController] Error:", errorMessage);

    return createServerResponse(statusCode, errorMessage, undefined, errorResponseCode);
  }
}
