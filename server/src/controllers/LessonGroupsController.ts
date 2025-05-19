import { APIGatewayEvent } from "aws-lambda";
import { LessonGroupService } from "../services/LessonGroupService";
import {
  createResponseWithData,
  createServerErrorResponse,
  extractBodyFromEvent,
} from "../utils/utils";
import { StatusCode } from "../enums/StatusCode";

export class LessonGroupsController {
  static async addLessonGroup(event: APIGatewayEvent) {
    const { group } = extractBodyFromEvent(event);

    try {
      const lessonGroup = await LessonGroupService.addLessonGroup(group);

      return createResponseWithData(StatusCode.CREATED, lessonGroup);
    } catch (e) {
      return createServerErrorResponse(e);
    }
  }

  static async updateLessonGroup(event: APIGatewayEvent) {
    const { id, group } = extractBodyFromEvent(event);

    try {
      const lessonGroup = await LessonGroupService.updateLessonGroup(id, group);

      return createResponseWithData(StatusCode.OK, lessonGroup);
    } catch (e) {
      return createServerErrorResponse(e);
    }
  }

  static async deleteLessonGroup(event: APIGatewayEvent) {
    const { id } = extractBodyFromEvent(event);

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
    const { id } = extractBodyFromEvent(event);

    try {
    const lessonGroup = await LessonGroupService.getLessonGroupById(id);

      return createResponseWithData(StatusCode.OK, lessonGroup);
    } catch (e) {
      return createServerErrorResponse(e);
    }
  }
}
