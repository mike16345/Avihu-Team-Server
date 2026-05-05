import { APIGatewayEvent } from "aws-lambda";
import { validateBody } from "../utils/utils";
import { TrainerSchemaValidation } from "../models/trainerModel";

export const validateTrainer = (event: APIGatewayEvent) => {
  return validateBody(event, TrainerSchemaValidation);
};
