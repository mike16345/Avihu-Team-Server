import { APIGatewayEvent } from "aws-lambda";
import Joi from "joi";
import { validateBody } from "../utils/utils";
import { SubTrainerSchemaValidation } from "../models/subTrainerModel";

const createSubTrainerValidation = SubTrainerSchemaValidation.keys({
  password: Joi.string().min(6).required(),
});

export const validateCreateSubTrainer = (event: APIGatewayEvent) => {
  return validateBody(event, createSubTrainerValidation);
};

export const validateUpdateSubTrainer = (event: APIGatewayEvent) => {
  return validateBody(event, SubTrainerSchemaValidation);
};
