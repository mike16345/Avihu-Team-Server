import { WeighInSchemaValidation } from "../models/weighInModel";
import { APIGatewayEvent } from "aws-lambda";
import { validateBody } from "../utils/utils";

export const validateWeighIn = (event: APIGatewayEvent) => {
  return validateBody(event, WeighInSchemaValidation);
};
