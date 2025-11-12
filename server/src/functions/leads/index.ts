import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handleApiCall } from "../baseHandler";
import PublicSignupController from "../../controllers/PublicSignupController";
import AdminLeadsController from "../../controllers/AdminLeadsController";

const publicSignupController = new PublicSignupController();
const adminLeadsController = new AdminLeadsController();

const handlers = {
  ["POST /public/signup"]: publicSignupController.signup,
  ["GET /admin/leads"]: adminLeadsController.getLeads,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return handleApiCall(event, context, handlers);
};
