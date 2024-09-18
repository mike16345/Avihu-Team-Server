import { APIGatewayEvent } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import Joi from "joi";

export const removeNestedIds: any = (doc: any) => {
  if (Array.isArray(doc)) {
    return doc.map((item) => removeNestedIds(item));
  } else if (doc !== null && typeof doc === "object") {
    const newDoc = { ...doc };
    delete newDoc._id;
    for (const key in newDoc) {
      if (newDoc.hasOwnProperty(key)) {
        newDoc[key] = removeNestedIds(newDoc[key]);
      }
    }
    return newDoc;
  }
  return doc;
};

export const createResponse = (statusCode: StatusCode, message?: string) => {
  return {
    statusCode: statusCode,
    body: JSON.stringify({
      message,
    }),
  };
};

export const createResponseWithData = (statusCode: StatusCode, data: any, message?: string) => {
  return {
    statusCode: statusCode,
    body: JSON.stringify({
      message,
      data,
    }),
  };
};

export const createServerErrorResponse = (err: any) => {
  return {
    statusCode: StatusCode.INTERNAL_SERVER_ERROR,
    body: JSON.stringify({
      message: err?.message || err,
    }),
  };
};

export const createValidatorResponse = (isValid: boolean, message?: string) => {
  return {
    isValid,
    message,
  };
};

export const validateBody = (event: APIGatewayEvent, validator: Joi.AnySchema<any>) => {
  const body = extractBodyFromEvent(event);
  const data = removeNestedIds(body);
  const { error } = validator.validate(data);
  const isValid = !error;

  return createValidatorResponse(isValid, error?.message);
};

export const extractBodyFromEvent = (event: APIGatewayEvent) => {
  return JSON.parse(event.body || "{}");
};
