import { lessonGroupJoiSchema } from "../models/lessonGroupsModel";
import { stripClientTrainerIdFromBody, validateBody } from "../utils/utils";
import { APIGatewayEvent } from "aws-lambda";

export const validateLessonGroup = (event: APIGatewayEvent) => {
  stripClientTrainerIdFromBody(event);
  return validateBody(event, lessonGroupJoiSchema);
};
