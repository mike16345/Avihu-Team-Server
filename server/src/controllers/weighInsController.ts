import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { IWeighIn, IWeighIns } from "../interfaces/IWeighIns";
import { StatusCode } from "../enums/StatusCode";
import { extractBodyFromEvent } from "../utils/utils";
import BaseController from "./BaseController";
import WeighInService from "../services/weighInService";

class WeighInsController extends BaseController<IWeighIns, WeighInService> {
  constructor() {
    super(new WeighInService());
  }

  addWeighIn = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { error, id } = this.getParamsOrError(event, ["id"]);

    if (error) return error;
    const weighInToAdd = extractBodyFromEvent(event);

    try {
      const weighIn = await this.service.addWeighIn(weighInToAdd, id);

      return this.successResponse({
        status: StatusCode.CREATED,
        data: weighIn,
        message: "Successfully added weigh in!",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  addManyWeighIns = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { error, id } = this.getParamsOrError(event, ["id"]);

    if (error) return error;
    const weighIns = extractBodyFromEvent(event).weighIns as IWeighIn[];

    try {
      const result = await this.service.addManyWeighIns(weighIns, id);

      return this.successResponse({
        status: StatusCode.CREATED,
        data: result,
        message: "Successfully added weigh ins!",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  updateWeighIn = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { id, error } = this.getParamsOrError(event, ["id"]);
    const { weight } = extractBodyFromEvent(event);

    if (error) return error;

    try {
      const updatedWeighIn = await this.service.updateWeighIn(id, weight);

      return this.successResponse({
        data: updatedWeighIn,
        message: "Successfully updated weigh in",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  getWeighInsByUserId = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { error, id } = this.getParamsOrError(event, ["id"]);

    if (error) return error;

    try {
      const weighIns = await this.service.getWeighInsByUserId(id as string);
      if (!weighIns.length) {
        return this.errorResponse("No weigh ins found for this user.", StatusCode.NOT_FOUND);
      }

      return this.successResponse({
        data: weighIns,
        message: "Successfully retrieved weigh ins!",
      });
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };
}

export default WeighInsController;
