import { DietPlanSchemaValidation } from "../models/dietPlanModel";
import { validateBody } from "../utils/utils";
import { DietPlanPresetSchemaValidation } from "../models/dietPlanPresetModel";
import { APIGatewayEvent } from "aws-lambda";

export const validateDietPlan = (event: APIGatewayEvent) => {
  return validateBody(event, DietPlanSchemaValidation);
};

export const validateDietPlanPreset = (event: APIGatewayEvent) => {
  return validateBody(event, DietPlanPresetSchemaValidation);
};
