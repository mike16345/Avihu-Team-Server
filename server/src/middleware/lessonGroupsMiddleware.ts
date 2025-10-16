import { lessonGroupJoiSchema } from "../models/lessonGroupsModel";
import { validateBody } from "../utils/utils";
import { APIGatewayEvent } from "aws-lambda";

export const validateLessonGroup = (event: APIGatewayEvent) => {
  return validateBody(event, lessonGroupJoiSchema);
};
