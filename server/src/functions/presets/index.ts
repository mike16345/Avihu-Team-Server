import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { StatusCode } from "../../enums/StatusCode";
import { API_HEADERS } from "../../constants/Constants";
import { ApiRouteHandlers } from "../../types/lambdaTypes";
import { BASE_PATH as DIET_PLANS_BASE_PATH, dietPlanPresetApiRoutes } from "./dietPlans";
import { EXERCISES_BASE_PATH, exercisePresetApiRoutes } from "./exercises";
import { BASE_PATH as WORKOUT_BASE_PATH, workoutPlanPresetApiRoutes } from "./workoutPlans";
import { EXERCISE_METHODS_BASE_PATH, exerciseMethodsApiRoutes } from "./exerciseMethods";
import { CARDIO_WORKOUT_BASE_PATH, cardioWorkoutApiRoutes } from "./cardioWorkout";
import { FORM_PRESET_BASE_PATH, formPresetApiRoutes } from "./formPreset";

export const BASE_PATH = "/presets";

const routeToPresetMap: Record<string, ApiRouteHandlers> = {
  [DIET_PLANS_BASE_PATH]: dietPlanPresetApiRoutes,
  [EXERCISES_BASE_PATH]: exercisePresetApiRoutes,
  [WORKOUT_BASE_PATH]: workoutPlanPresetApiRoutes,
  [EXERCISE_METHODS_BASE_PATH]: exerciseMethodsApiRoutes,
  [CARDIO_WORKOUT_BASE_PATH]: cardioWorkoutApiRoutes,
  [FORM_PRESET_BASE_PATH]: formPresetApiRoutes,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const presetHandlerKey = determinePreset(event.path) as keyof typeof routeToPresetMap;
  const presetApiRoutes = routeToPresetMap[presetHandlerKey];

  if (!presetApiRoutes) {
    return {
      statusCode: StatusCode.NOT_FOUND,
      body: JSON.stringify({ message: `No preset handlers found for: ${presetHandlerKey}` }),
      headers: API_HEADERS,
    };
  }

  return await handleApiCall(event, context, presetApiRoutes);
};

function determinePreset(path: string): string {
  const cleanedPath = path.split("?")[0].split("#")[0];
  const splitPaths = cleanedPath.split("/");

  return `/${splitPaths[1]}/${splitPaths[2]}`;
}
