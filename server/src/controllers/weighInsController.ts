import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { weighInServices } from "../services/weighInService";
import { IWeighIn } from "../interfaces/IWeighIns";
import { StatusCode } from "../enums/StatusCode";

class WeighInsController {
  static addWeighIn = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const id = event.queryStringParameters?.id || "";
    const weighInToAdd = JSON.parse(event.body || "{}");

    try {
      const weighIn = await weighInServices.addWeighIn(weighInToAdd, id);

      return {
        statusCode: StatusCode.CREATED,
        body: JSON.stringify(weighIn),
      };
    } catch (err: any) {
      return {
        statusCode: StatusCode.INTERNAL_SERVER_ERROR,
        body: JSON.stringify({ message: err.message }),
      };
    }
  };

  static addManyWeighIns = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const id = event.queryStringParameters?.id || "";
    const weighIns = JSON.parse(event.body || "{}").weighIns as IWeighIn[];

    try {
      const result = await weighInServices.addManyWeighIns(weighIns, id);
      return {
        statusCode: StatusCode.CREATED,
        body: JSON.stringify(result),
      };
    } catch (err: any) {
      return {
        statusCode: StatusCode.INTERNAL_SERVER_ERROR,
        body: JSON.stringify({ message: err.message }),
      };
    }
  };

  static updateWeighIn = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const id = event.queryStringParameters?.id || "";
    const { weight } = JSON.parse(event.body || "{}");

    try {
      const updatedWeighIn = await weighInServices.updateWeighIn(id, weight);

      if (!updatedWeighIn) {
        return {
          statusCode: StatusCode.NOT_FOUND,
          body: JSON.stringify({ message: "Weigh in not found!" }),
        };
      }

      return {
        statusCode: StatusCode.OK,
        body: JSON.stringify(updatedWeighIn),
      };
    } catch (err: any) {
      return {
        statusCode: StatusCode.INTERNAL_SERVER_ERROR,
        body: JSON.stringify({ message: err.message }),
      };
    }
  };

  static deleteUserWeighIns = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const id = event.queryStringParameters?.id || "";

    try {
      const response = await weighInServices.deleteUserWeighIns(id);
      return {
        statusCode: StatusCode.OK,
        body: JSON.stringify(response),
      };
    } catch (err) {
      return {
        statusCode: StatusCode.INTERNAL_SERVER_ERROR,
        body: JSON.stringify({ message: "There was an error deleting weigh ins." }),
      };
    }
  };

  static deleteWeighInById = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const weighInId = event.queryStringParameters?.weighInId || "";

    try {
      const response = await weighInServices.deleteWeighInById(weighInId);

      if (!response) {
        return {
          statusCode: StatusCode.NOT_FOUND,
          body: JSON.stringify({ message: "Did not find weigh in to delete." }),
        };
      }

      return {
        statusCode: StatusCode.OK,
        body: JSON.stringify(response),
      };
    } catch (err: any) {
      return {
        statusCode: StatusCode.INTERNAL_SERVER_ERROR,
        body: JSON.stringify({ message: err.message }),
      };
    }
  };

  static getWeighInsByUserId = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const id = event.queryStringParameters?.id;

    try {
      const weighIns = await weighInServices.getWeighInsByUserId(id as string);
      if (!weighIns) {
        return {
          statusCode: StatusCode.NOT_FOUND,
          body: JSON.stringify({ message: "No weigh ins found for this user." }),
        };
      }

      return {
        statusCode: StatusCode.OK,
        body: JSON.stringify(weighIns),
      };
    } catch (err) {
      return {
        statusCode: StatusCode.INTERNAL_SERVER_ERROR,
        body: JSON.stringify({ message: "An error occurred while requesting the weigh-ins." }),
      };
    }
  };

  static getWeighInsById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const id = event.queryStringParameters?.id || "";

    try {
      const weighIns = await weighInServices.getWeighInsById(id);

      return {
        statusCode: StatusCode.OK,
        body: JSON.stringify(weighIns),
      };
    } catch (err) {
      return {
        statusCode: StatusCode.INTERNAL_SERVER_ERROR,
        body: JSON.stringify({ message: "An error occurred while requesting the weigh-ins." }),
      };
    }
  };
}

export default WeighInsController;
