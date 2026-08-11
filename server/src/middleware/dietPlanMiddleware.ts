import { DietPlanSchemaValidation } from "../models/dietPlanModel";
import { validateBody } from "../utils/utils";
import { DietPlanPresetSchemaValidation } from "../models/dietPlanPresetModel";
import { APIGatewayEvent } from "aws-lambda";
import { extractBodyFromEvent } from "../utils/utils";
import {
  DietPlanPresetV2SchemaValidation,
  DietPlanV2SchemaValidation,
} from "../models/dietPlanV2Schemas";

export const validateDietPlan = (event: APIGatewayEvent) => {
  const body = extractBodyFromEvent(event);

  return validateBody(event, body.version === 2 ? DietPlanV2SchemaValidation : DietPlanSchemaValidation);
};

export const validateDietPlanPreset = (event: APIGatewayEvent) => {
  const body = extractBodyFromEvent(event);

  return validateBody(
    event,
    body.version === 2 ? DietPlanPresetV2SchemaValidation : DietPlanPresetSchemaValidation
  );
};
