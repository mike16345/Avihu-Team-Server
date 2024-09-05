import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { BASE_PATH as DIET_PLANS_BASE_PATH, dietPlanPresetApiHandlers } from "./dietPlans";
import { handleApiCall } from "../baseHandler";
import { exercisePresetApiHandlers, EXERCISES_BASE_PATH } from "./exercises";

export const BASE_PATH = "/presets";

const routeToPresetMap: Record<string, Record<string, Function>> = {
  [DIET_PLANS_BASE_PATH]: dietPlanPresetApiHandlers,
  [EXERCISES_BASE_PATH]: exercisePresetApiHandlers,
};

const presetMiddleWareMap: Record<string, Record<string, Function>> = {
  [EXERCISES_BASE_PATH]: exercisePresetApiHandlers,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const presetHandlerKey = determinePreset(event.path) as keyof typeof routeToPresetMap;
  const middlewareHandler = presetMiddleWareMap[presetHandlerKey];
  const presetApiHandler = routeToPresetMap[presetHandlerKey];
  console.log("preset key", presetHandlerKey);
  console.log("preset handler keys", Object.keys(routeToPresetMap));

  if (!presetApiHandler) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "Not Found" }),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*", // Allow any method
        "Access-Control-Allow-Headers": "Content-Type",
      },
    };
  }

  if (middlewareHandler) {
    await handleApiCall(event, context, middlewareHandler);
  }

  return await handleApiCall(event, context, presetApiHandler);
};

function determinePreset(path: string): string {
  const cleanedPath = path.split("?")[0].split("#")[0];

  return cleanedPath;
}
