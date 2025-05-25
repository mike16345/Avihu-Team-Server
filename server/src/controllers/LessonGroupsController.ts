import { APIGatewayEvent } from "aws-lambda";
import { LessonGroupService } from "../services/LessonGroupService";
import {
  createResponse,
  createResponseWithData,
  createServerErrorResponse,
  extractBodyFromEvent,
  extractQueryFromEvent,
} from "../utils/utils";
import { StatusCode } from "../enums/StatusCode";

export class LessonGroupsController {
  static async addLessonGroup(event: APIGatewayEvent) {
    const { name } = extractBodyFromEvent(event);

    try {
      const lessonGroup = await LessonGroupService.addLessonGroup(name);

      return createResponseWithData(StatusCode.CREATED, lessonGroup);
    } catch (e) {
      return createServerErrorResponse(e);
    }
  }

  static async updateLessonGroup(event: APIGatewayEvent) {
    const { id = "" } = extractQueryFromEvent(event);
    const { name } = extractBodyFromEvent(event);

    try {
      const lessonGroup = await LessonGroupService.updateLessonGroup(id, name);

      return createResponseWithData(StatusCode.OK, lessonGroup);
    } catch (e) {
      return createServerErrorResponse(e);
    }
  }

  static async deleteLessonGroup(event: APIGatewayEvent) {
    const { id } = extractQueryFromEvent(event);

    if (!id) {
      return createResponse(StatusCode.BAD_REQUEST, '"id" is required!');
    }

    try {
      const lessonGroup = await LessonGroupService.deleteLessonGroup(id);

      return createResponseWithData(StatusCode.OK, lessonGroup);
    } catch (e) {
      return createServerErrorResponse(e);
    }
  }

  static async getLessonGroups(event: APIGatewayEvent) {
    try {
      const lessonGroups = await LessonGroupService.getLessonGroups();

      return createResponseWithData(StatusCode.OK, lessonGroups);
    } catch (e) {
      return createServerErrorResponse(e);
    }
  }

  static async getLessonGroupById(event: APIGatewayEvent) {
    const { id } = extractQueryFromEvent(event);

    if (!id) {
      return createResponse(StatusCode.BAD_REQUEST, '"id" is required!');
    }
    try {
      const lessonGroup = await LessonGroupService.getLessonGroupById(id);

      return createResponseWithData(StatusCode.OK, lessonGroup);
    } catch (e) {
      return createServerErrorResponse(e);
    }
  }
}
