import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { weighInServices } from "../services/weighInService";
import { IWeighIn } from "../interfaces/IWeighIns";
import { StatusCode } from "../enums/StatusCode";
import { createResponse, createResponseWithData, createServerErrorResponse } from "../utils/utils";

class WeighInsController {
  static addWeighIn = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const id = event.queryStringParameters?.id || "";
    const weighInToAdd = JSON.parse(event.body || "{}");

    try {
      const weighIn = await weighInServices.addWeighIn(weighInToAdd, id);

      return createResponseWithData(StatusCode.CREATED, weighIn, "Successfully added weigh in!");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };

  static addManyWeighIns = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const id = event.queryStringParameters?.id || "";
    const weighIns = JSON.parse(event.body || "{}").weighIns as IWeighIn[];

    try {
      const result = await weighInServices.addManyWeighIns(weighIns, id);

      return createResponseWithData(StatusCode.CREATED, result, "Successfully added weigh ins!");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };

  static updateWeighIn = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const id = event.queryStringParameters?.id || "";
    const { weight } = JSON.parse(event.body || "{}");

    try {
      const updatedWeighIn = await weighInServices.updateWeighIn(id, weight);

      if (!updatedWeighIn) {
        return createResponse(StatusCode.NOT_FOUND, "Weigh in not found!");
      }

      return createResponseWithData(StatusCode.OK, updatedWeighIn, "Successfully updated weigh in");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };

  static deleteUserWeighIns = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const id = event.queryStringParameters?.id || "";

    try {
      const response = await weighInServices.deleteUserWeighIns(id);

      return createResponseWithData(StatusCode.OK, response, "Deleted user weigh ins");
    } catch (err) {
      return createServerErrorResponse(err);
    }
  };

  static deleteWeighInById = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const weighInId = event.queryStringParameters?.weighInId || "";

    try {
      const response = await weighInServices.deleteWeighInById(weighInId);

      if (!response) {
        return createResponse(StatusCode.NOT_FOUND, "Did not find weigh in to delete.");
      }

      return createResponseWithData(StatusCode.OK, response, "Deleted weigh in!");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };

  static getWeighInsByUserId = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const id = event.queryStringParameters?.id;

    try {
      const weighIns = (await weighInServices.getWeighInsByUserId(id as string)) || [];
      if (!weighIns.length) {
        return createResponseWithData(
          StatusCode.NOT_FOUND,
          weighIns,
          "No weigh ins found for this user."
        );
      }

      return createResponseWithData(StatusCode.OK, weighIns, "Successfully retrieved weigh ins!");
    } catch (err: any) {
      return createServerErrorResponse(err);
    }
  };

  static getWeighInsById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const id = event.queryStringParameters?.id || "";

    try {
      const weighIns = await weighInServices.getWeighInsById(id);

      return createResponseWithData(StatusCode.OK, weighIns, "Successfully retrieved weigh ins");
    } catch (err) {
      return createServerErrorResponse(err);
    }
  };
}

export default WeighInsController;
