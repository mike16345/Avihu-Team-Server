import { StatusCode } from "../enums/StatusCode";

export type HttpError = {
  statusCode: number;
  message: string;
  code?: string;
};

export class UnauthorizedError extends Error {
  statusCode: StatusCode.UNAUTHORIZED;
  code?: string;

  constructor(message = "Unauthorized", code?: string) {
    super(message);
    this.name = "UnauthorizedError";
    this.statusCode = StatusCode.UNAUTHORIZED;
    this.code = code;
  }
}

export const createHttpError = (
  statusCode: number,
  message: string,
  code?: string
): HttpError => ({
  statusCode,
  message,
  ...(code ? { code } : {}),
});

export const createUnauthorizedError = (code?: string, message = "Unauthorized") =>
  createHttpError(StatusCode.UNAUTHORIZED, message, code);

export const createForbiddenError = (code?: string, message = "Forbidden") =>
  createHttpError(StatusCode.FORBIDDEN, message, code);
