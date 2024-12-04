import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import { OTPController } from "../../controllers/OTPController";

const BASE_PATH = "/otp";

const otpApiHandlers = {
  [`POST ${BASE_PATH}`]: OTPController.generateAndSendOTP,
  [`POST ${BASE_PATH}/validate`]: OTPController.confirmOtp,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return await handleApiCall(event, context, otpApiHandlers);
};
