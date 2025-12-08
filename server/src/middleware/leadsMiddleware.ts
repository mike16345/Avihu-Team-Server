import { APIGatewayEvent } from "aws-lambda";
import { LeadCreateSchema, LeadUpdateSchema } from "../models/LeadsModel";
import { validateBody } from "../utils/utils";

export const validateCreateLead = (event: APIGatewayEvent) => {
  return validateBody(event, LeadCreateSchema);
};

export const validateUpdateLead = (event: APIGatewayEvent) => {
  return validateBody(event, LeadUpdateSchema);
};
