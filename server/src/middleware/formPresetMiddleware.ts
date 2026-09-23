import { formValidator } from "../models/formPresetModel";
import { stripClientTrainerIdFromBody, validateBody } from "../utils/utils";
import { APIGatewayEvent } from "aws-lambda";

export const validateFormPreset = (event: APIGatewayEvent) => {
  stripClientTrainerIdFromBody(event);
  return validateBody(event, formValidator);
};
