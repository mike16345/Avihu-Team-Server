import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { BASE_PATH as DIET_PLANS_BASE_PATH, dietPlanPresetApiHandlers } from "./dietPlans";
import { handleApiCall } from "../baseHandler";
import {
  exercisePresetApiHandlers,
  exerciseMiddlewareHandlers,
  EXERCISES_BASE_PATH,
} from "./exercises";
import {
  workoutPlanPresetApiHandlers,
  BASE_PATH as WORKOUT_BASE_PATH,
  workoutPlanPresetApiMiddleware,
} from "./workoutPlans";
import { StatusCode } from "../../enums/StatusCode";
import { API_HEADERS } from "../../constants/Constants";

export const BASE_PATH = "/presets";

const routeToPresetMap: Record<string, Record<string, Function>> = {
  [DIET_PLANS_BASE_PATH]: dietPlanPresetApiHandlers,
  [EXERCISES_BASE_PATH]: exercisePresetApiHandlers,
  [WORKOUT_BASE_PATH]: workoutPlanPresetApiHandlers,
};

const presetMiddleWareMap: Record<string, Record<string, Function>> = {
  [EXERCISES_BASE_PATH]: exerciseMiddlewareHandlers,
  [WORKOUT_BASE_PATH]: workoutPlanPresetApiMiddleware,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const presetHandlerKey = determinePreset(event.path) as keyof typeof routeToPresetMap;
  const middlewareHandler = presetMiddleWareMap[presetHandlerKey];
  const presetApiHandler = routeToPresetMap[presetHandlerKey];

  if (!presetApiHandler) {
    return {
      statusCode: StatusCode.NOT_FOUND,
      body: JSON.stringify({ message: `No preset handlers found for: ${presetHandlerKey}` }),
      headers: API_HEADERS,
    };
  }

  return await handleApiCall(event, context, presetApiHandler, middlewareHandler);
};

function determinePreset(path: string): string {
  const cleanedPath = path.split("?")[0].split("#")[0];
  const splitPaths = cleanedPath.split("/");

  return `/${splitPaths[1]}/${splitPaths[2]}`;
}
