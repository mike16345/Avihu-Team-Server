import { APIGatewayProxyEvent } from "aws-lambda";

const runMiddlewares = async (
  middlewares: Array<Function>,
  event: APIGatewayProxyEvent,
  context: Context
) => {
  for (const middleware of middlewares) {
    const middlewareResult = await middleware(event, context);

    if (!middlewareResult.isValid) {
      console.log("Middleware failed:", middlewareResult.message);
      return {
        isValid: false,
        message: middlewareResult.message,
      };
    }
  }

  return { isValid: true };
};
