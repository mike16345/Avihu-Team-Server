import { APIGatewayEvent } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import Joi from "joi";
import { ISession } from "../models/sessionModel";
import { API_HEADERS } from "../constants/Constants";
import { DietPlanService } from "../services/dietPlanService";
import { RecordedSetsService } from "../services/recordedSetsService";
import { UserImageUrlService } from "../services/UserImageUrlService";
import PasswordsService from "../services/PasswordsService";
import { WorkoutPlanService } from "../services/workoutPlanService";
import WeighInService from "../services/weighInService";

export const removeNestedIds: any = (doc: any) => {
  if (Array.isArray(doc)) {
    return doc.map((item) => removeNestedIds(item));
  } else if (doc !== null && typeof doc === "object") {
    const newDoc = { ...doc };
    delete newDoc._id;
    delete newDoc.__v;

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

export const createServerResponse = (statusCode: StatusCode, message?: string, data?: any) => {
  return {
    statusCode: statusCode,
    body: JSON.stringify({
      message,
      data,
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
    headers: API_HEADERS,
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

export const extractQueryFromEvent = (event: any) => {
  return event.queryStringParameters || {};
};

export const generateOTP = (length: number = 6) => {
  const digits = "0123456789";
  let otp = "";

  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }

  return otp;
};

export const isSessionExpired = (
  session: ISession,
  expiresAfter: number,
  field: keyof ISession = "createdAt"
) => {
  const now = new Date().getTime();
  const workoutExpiration = new Date(session[field]).getTime() + expiresAfter;

  return now > workoutExpiration;
};

export const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;

    return v.toString(16);
  });
};

export const returnStringVal = (arr: any[]) => {
  let returnStr = ``;
  arr.forEach((item) => (returnStr += item.toString()));
  return returnStr;
};

export const deleteUserDataFromAllCollections = async (userId: string) => {
  await new DietPlanService().delete({ userId }).catch((err) => console.log(err));
  await new RecordedSetsService().deleteMany({ userId }).catch((err) => console.log(err));
  await new WeighInService().delete({ userId }).catch((err) => console.log(err));
  await new UserImageUrlService().delete({ userId }).catch((err) => console.log(err));
  await new PasswordsService().deletePasswordByUserId(userId).catch((err) => console.log(err));
  await new WorkoutPlanService().deleteMany({ userId }).catch((err) => console.log(err));
};

export function stableStringify(obj: any): string {
  // Simple stable stringify by sorting keys (can be improved if needed)
  if (!obj || typeof obj !== "object") return String(obj);
  if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(",")}]`;
  return (
    "{" +
    Object.keys(obj)
      .sort()
      .map((key) => `"${key}":${stableStringify(obj[key])}`)
      .join(",") +
    "}"
  );
}

export const createMissingParamErrorMessage = (paramNames: string[]) => {
  return `"${paramNames.join(" ")}" params are required!`;
};

export const getHeaderValue = (
  headers: Record<string, any> = {},
  key: string
): string | undefined => {
  const lower = key.toLowerCase();
  return Object.entries(headers).find(([k]) => k.toLowerCase() === lower)?.[1];
};

export const getRequestIp = (event: APIGatewayEvent): string | undefined => {
  const forwardedFor = getHeaderValue(event.headers || {}, "x-forwarded-for");

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return event.requestContext?.identity?.sourceIp || undefined;
};
