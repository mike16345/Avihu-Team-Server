import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import { CardioWorkoutService } from "../services/cardioWorkoutService";
import { createResponse, createResponseWithData, createServerErrorResponse } from "../utils/utils";

export default class CardioWorkoutController {
  static async getAllCardioWorkout(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    try {
      const allCardioWorkout = await CardioWorkoutService.getAllCardioWorkouts();

      if (!allCardioWorkout) {
        return createResponse(StatusCode.NOT_FOUND, "לא נמצאו תרגילים!");
      }

      return createResponseWithData(StatusCode.OK, allCardioWorkout, "תרגילים נשלפו בהצלחה!");
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }

  static async getCardioWorkoutById(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const { id } = event.queryStringParameters || {};

    try {
      const cardioWorkout = await CardioWorkoutService.getCardioWorkoutById(id || "");

      if (!cardioWorkout) {
        return createResponse(StatusCode.NOT_FOUND, "לא נמצא תרגיל!");
      }

      return createResponseWithData(StatusCode.OK, cardioWorkout, "תרגיל נשלף בהצלחה!");
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }

  static async addCardioWorkout(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const cardioWorkout = JSON.parse(event.body || "{}");

    try {
      const newCardioWorkout = await CardioWorkoutService.addCardioWorkout(cardioWorkout);

      if (!newCardioWorkout) {
        return createResponse(StatusCode.BAD_REQUEST, "אירעה שגיאה ביצירת התרגיל!");
      }

      return createResponseWithData(StatusCode.CREATED, newCardioWorkout, "תרגיל נוצר בהצלחה!");
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }

  static async editCardioWorkout(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const cardioWorkout = JSON.parse(event.body || "{}");
    const { id } = event.queryStringParameters || {};

    try {
      const updatedCardioWorkout = await CardioWorkoutService.editCardioWorkout(
        cardioWorkout,
        id || ""
      );

      if (!updatedCardioWorkout) {
        return createResponse(StatusCode.NOT_FOUND, "תרגיל לא נמצא!");
      }

      return createResponseWithData(StatusCode.OK, updatedCardioWorkout, "תרגיל עודכן בהצלחה!");
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }

  static async deleteCardioWorkout(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const { id } = event.queryStringParameters || {};

    try {
      const deletedCardioWorkout = await CardioWorkoutService.deleteCardioWorkout(id || "");

      if (!deletedCardioWorkout) {
        return createResponse(StatusCode.NOT_FOUND, "אירעה שגיאה במחיקת התרגיל!");
      }

      return createResponseWithData(StatusCode.OK, deletedCardioWorkout, "תרגיל נמחק בהצלחה!");
    } catch (error: any) {
      return createServerErrorResponse(error.message);
    }
  }
}
