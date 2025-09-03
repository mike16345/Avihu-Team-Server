import BaseController from "./BaseController";
import { IProgressNotes } from "../interfaces/userProgress";
import { ProgressNoteService } from "../services/userProgressNoteService";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";

export default class ProgressNotesController extends BaseController<
  IProgressNotes,
  ProgressNoteService
> {
  constructor() {
    super(new ProgressNoteService());
  }

  getProgressNotesByUserId = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const { error, userId } = this.getParamsOrError(event, ["userId"]);

    if (error) return error;

    try {
      const response = await this.service.getProgressNotesByUserId(userId);

      return this.successResponse({
        data: response,
        message: "Successfully retrieved progress notes",
        status: StatusCode.OK,
      });
    } catch (error) {
      return this.errorResponse(error);
    }
  };

  removeProgressNote = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { error, userId, noteId } = this.getParamsOrError(event, ["userId", "noteId"]);

    if (error) return error;

    try {
      const response = await this.service.removeProgressNote(userId, noteId);

      return this.successResponse({
        data: response,
        message: "Successfully deleted progress notes",
        status: StatusCode.OK,
      });
    } catch (error) {
      return this.errorResponse(error);
    }
  };

  addProgressNote = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { error, userId, date, content, cardio, workouts, diet, trainer } = this.getParamsOrError(
      event,
      ["userId", "date", "content", "trainer"],
      "body"
    );

    if (error) return error;

    try {
      const response = await this.service.addProgressNote(userId, {
        date,
        content,
        cardio,
        workouts,
        trainer,
        diet,
      });

      return this.successResponse({
        data: response,
        message: "Successfully created progress note",
        status: StatusCode.OK,
      });
    } catch (error) {
      return this.errorResponse(error);
    }
  };

  updateProgressNote = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { error, userId, date, content, cardio, workouts, diet, trainer, noteId } =
      this.getParamsOrError(event, ["userId", "date", "content", "trainer", "noteId"], "body");

    if (error) return error;

    try {
      const response = await this.service.updateProgressNote(userId, noteId, {
        date,
        content,
        cardio,
        workouts,
        trainer,
        diet,
      });

      return this.successResponse({
        data: response,
        message: "Successfully created progress note",
        status: StatusCode.OK,
      });
    } catch (error) {
      return this.errorResponse(error);
    }
  };
}
