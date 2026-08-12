import { DietPlanSchemaValidation, DietPlanUpdateSchemaValidation } from "../models/dietPlanModel";
import { validateBody } from "../utils/utils";
import { DietPlanPresetSchemaValidation } from "../models/dietPlanPresetModel";
import { APIGatewayEvent } from "aws-lambda";
import { extractBodyFromEvent } from "../utils/utils";
import {
  DietPlanPresetV2SchemaValidation,
  DietPlanV2SchemaValidation,
  DietPlanV2UpdateSchemaValidation,
} from "../models/dietPlanV2Schemas";

const getDietPlanValidationSchema = (version: unknown, isUpdate: boolean) => {
  if (version === 2) {
    return isUpdate ? DietPlanV2UpdateSchemaValidation : DietPlanV2SchemaValidation;
  }

  return isUpdate ? DietPlanUpdateSchemaValidation : DietPlanSchemaValidation;
};

export const validateDietPlan = (event: APIGatewayEvent) => {
  const body = extractBodyFromEvent(event);
  const isUpdate = event.httpMethod === "PUT";
  const schema = getDietPlanValidationSchema(body.version, isUpdate);

  return validateBody(event, schema);
};

export const validateDietPlanPreset = (event: APIGatewayEvent) => {
  const body = extractBodyFromEvent(event);

  return validateBody(
    event,
    body.version === 2 ? DietPlanPresetV2SchemaValidation : DietPlanPresetSchemaValidation
  );
};
