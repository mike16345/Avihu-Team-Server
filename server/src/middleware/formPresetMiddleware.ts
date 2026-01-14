import { formValidator } from "../models/formPresetModel";
import { validateBody } from "../utils/utils";
import { APIGatewayEvent } from "aws-lambda";

export const validateFormPreset = (event: APIGatewayEvent) => {
  return validateBody(event, formValidator);
};
