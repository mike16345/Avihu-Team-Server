import { APIGatewayEvent } from "aws-lambda";
import { StatusCode } from "../enums/StatusCode";
import Joi from "joi";
import { ISession } from "../models/sessionModel";
import {
  API_HEADERS,
  PAGINATION_LIMIT_FALLBACK,
  PAGINATION_PAGE_FALLBACK,
} from "../constants/Constants";

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

import type { ObjectId } from "mongodb";

export function removeNestedIdsSafe(input: any, seen = new WeakSet()): any {
  if (input === null || typeof input !== "object") return input;

  // Avoid infinite recursion on circular refs
  if (seen.has(input)) return input;
  seen.add(input);

  // Don’t recurse into common non-plain instances
  if (
    input instanceof Date ||
    (typeof Buffer !== "undefined" && Buffer.isBuffer?.(input)) ||
    (typeof Map !== "undefined" && input instanceof Map) ||
    (typeof Set !== "undefined" && input instanceof Set)
  ) {
    return input;
  }

  // Handle Mongo/Mongoose ObjectId specially (keep or stringify)
  if (isObjectId(input)) return input; // or: return String(input);

  if (Array.isArray(input)) {
    return input.map((item) => removeNestedIdsSafe(item, seen));
  }

  // Plain object: copy and recurse
  const out: any = {};
  for (const [k, v] of Object.entries(input)) {
    if (k === "_id" || k === "__v") continue;
    out[k] = removeNestedIdsSafe(v, seen);
  }
  return out;
}

function isObjectId(val: any): val is ObjectId {
  // Works for both native mongodb ObjectId and mongoose.Types.ObjectId
  return (
    val &&
    typeof val === "object" &&
    (typeof (val as any).toHexString === "function" ||
      (val.constructor && val.constructor.name === "ObjectId"))
  );
}

export const createResponse = (statusCode: StatusCode, message?: string, code?: string) => {
  return {
    statusCode: statusCode,
    body: JSON.stringify({
      message,
      ...(code ? { code } : {}),
    }),
  };
};

export const createServerResponse = (
  statusCode: StatusCode,
  message?: string,
  data?: any,
  code?: string
) => {
  return {
    statusCode: statusCode,
    body: JSON.stringify({
      message,
      data,
      ...(code ? { code } : {}),
    }),
  };
};

export const createResponseWithData = (
  statusCode: StatusCode,
  data: any,
  message?: string,
  code?: string
) => {
  return {
    statusCode: statusCode,
    body: JSON.stringify({
      message,
      data,
      ...(code ? { code } : {}),
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

export const extractPaginationParamsFromEvent = (event: any) => {
  const qs = extractQueryFromEvent(event);

  const page = Number(qs.page ?? qs._page ?? PAGINATION_PAGE_FALLBACK);
  const limit = Number(qs.limit ?? qs._limit ?? PAGINATION_LIMIT_FALLBACK);

  const parseJson = <T>(val?: string, fallback: T = {} as T): T => {
    if (!val) return fallback;
    try {
      const decoded = decodeURIComponent(val);
      return JSON.parse(decoded) as T;
    } catch {
      try {
        return JSON.parse(val) as T;
      } catch {
        return fallback;
      }
    }
  };

  const query = parseJson<Record<string, any>>(qs.query, {});
  const sort = parseJson<Record<string, any>>(qs.sort, {});

  return { page, limit, query, sort };
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
  const sessionTimestamp = session[field] as string | number | Date;
  const workoutExpiration = new Date(sessionTimestamp).getTime() + expiresAfter;

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
  const { DietPlanService } = require("../services/dietPlanService");
  const { RecordedSetsService } = require("../services/recordedSetsService");
  const { UserImageUrlService } = require("../services/UserImageUrlService");
  const PasswordsService = require("../services/PasswordsService").default;
  const { WorkoutPlanService } = require("../services/workoutPlanService");
  const WeighInService = require("../services/weighInService").default;

  await new DietPlanService().delete({ userId }).catch((err: any) => console.log(err));
  await new RecordedSetsService().deleteMany({ userId }).catch((err: any) => console.log(err));
  await new WeighInService().delete({ userId }).catch((err: any) => console.log(err));
  await new UserImageUrlService().delete({ userId }).catch((err: any) => console.log(err));
  await new PasswordsService().deletePasswordByUserId(userId).catch((err: any) => console.log(err));
  await new WorkoutPlanService().deleteMany({ userId }).catch((err: any) => console.log(err));
};

export const stripBase64DataUrl = (input: string): { mime?: string; base64: string } => {
  const trimmed = input.trim();
  const match = /^data:([^;]+);base64,(.*)$/i.exec(trimmed);
  if (match) {
    return { mime: match[1], base64: match[2] };
  }
  return { base64: trimmed };
};

export const streamToBuffer = async (stream: NodeJS.ReadableStream): Promise<Buffer> => {
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
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

export const extractBearerToken = (headers: Record<string, any> = {}): string => {
  const authHeader = getHeaderValue(headers, "authorization");

  if (!authHeader || typeof authHeader !== "string") {
    console.log("Authorization header missing or not a string:", authHeader);
    throw {
      message: "Unauthorized",
      statusCode: StatusCode.UNAUTHORIZED,
      code: "INVALID_TOKEN",
    };
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
    console.log("Invalid authorization header format:", authHeader);
    throw {
      message: "Unauthorized",
      statusCode: StatusCode.UNAUTHORIZED,
      code: "INVALID_TOKEN",
    };
  }

  return parts[1];
};

export const getRequestIp = (event: APIGatewayEvent): string | undefined => {
  const forwardedFor = getHeaderValue(event.headers || {}, "x-forwarded-for");

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return event.requestContext?.identity?.sourceIp || undefined;
};

export const removeSensitiveInfoFromLog = (obj: any) => {
  if (!obj || typeof obj !== "object") return obj;
  const { password, confirmPassword, ...rest } = obj;

  return rest;
};
