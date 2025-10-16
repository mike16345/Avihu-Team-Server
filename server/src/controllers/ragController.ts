import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ragAnswerService } from "../rag";
import { extractBodyFromEvent } from "../utils/utils";
import { StatusCode } from "../enums/StatusCode";
import { API_HEADERS } from "../constants/Constants";
import { RagRequest } from "../rag/types";
import UserService from "../services/userService";
import { requireAdmin } from "../guards/AdminAccessGuard";

const userService = new UserService();

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "close",
};

const ensureAdmin = async (adminUserId?: string) => {
  if (!adminUserId) {
    throw { status: StatusCode.FORBIDDEN, message: "admin privileges required" };
  }
  const admin = await userService.findById(adminUserId);
  requireAdmin(admin as any);
};

export class RagController {
  ask = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const body = extractBodyFromEvent(event);
      const request: RagRequest = {
        userId: body.userId,
        question: body.question,
        sessionId: body.sessionId,
        stream: Boolean(body.stream),
        topK: typeof body.topK === "number" ? body.topK : undefined,
        threshold: typeof body.threshold === "number" ? body.threshold : undefined,
        cacheThreshold:
          typeof body.cacheThreshold === "number" ? body.cacheThreshold : undefined,
        metadata: body.metadata,
      };

      const result = await ragAnswerService.answerQuestion(request);

      if (request.stream) {
        return {
          statusCode: StatusCode.OK,
          body: (result.events || []).join(""),
          headers: {
            ...API_HEADERS,
            ...SSE_HEADERS,
          },
        };
      }

      const payload = {
        reason: result.response.reason,
        answer: result.response.answer,
        citations: result.response.citations,
        usage: result.response.usage,
        cached: result.response.cached,
        notice: result.response.notice,
        language: result.languageDetection.targetLanguage,
      };

      return {
        statusCode: StatusCode.OK,
        body: JSON.stringify(payload),
        headers: API_HEADERS,
      };
    } catch (error: any) {
      console.error("rag.ask error", error);
      const status = error?.status || StatusCode.INTERNAL_SERVER_ERROR;
      const message = error?.message || "Failed to process request";
      return {
        statusCode: status,
        body: JSON.stringify({ message }),
        headers: API_HEADERS,
      };
    }
  };

  ingest = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const body = extractBodyFromEvent(event);
      await ensureAdmin(body.adminUserId);
      const result = await ragAnswerService.ingest(body);
      return {
        statusCode: StatusCode.OK,
        body: JSON.stringify({ message: "ingest completed", data: result }),
        headers: API_HEADERS,
      };
    } catch (error: any) {
      console.error("rag.ingest error", error);
      const status = error?.status || StatusCode.INTERNAL_SERVER_ERROR;
      const message = error?.message || "Failed to ingest sources";
      return {
        statusCode: status,
        body: JSON.stringify({ message }),
        headers: API_HEADERS,
      };
    }
  };
}
