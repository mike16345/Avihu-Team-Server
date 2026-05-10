import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { OTPController } from "../../controllers/OTPController";
import { ApiRouteHandlers } from "../../types/lambdaTypes";

const BASE_PATH = "/otp";

const otpApiRoutes: ApiRouteHandlers = {
  [`POST ${BASE_PATH}`]: {
    handler: OTPController.generateAndSendOTP,
    access: "public",
  },
  [`POST ${BASE_PATH}/validate`]: {
    handler: OTPController.confirmOtp,
    access: "public",
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, otpApiRoutes);
};
