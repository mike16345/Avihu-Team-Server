import { UserSchemaValidation } from "../models/userModel";
import { APIGatewayProxyEvent } from "aws-lambda";
import { Context } from "aws-sdk/clients/autoscaling";
import UserService from "../services/userService";

export const validateUser = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<{ isValid: boolean; message?: string }> => {
  const body = JSON.parse(event.body || "{}"); // Parse the JSON body

  try {
    const existingUser = await UserService.getUserByEmail(body.email);

    if (existingUser) return { isValid: false, message: "כתובת מייל בשימוש!" };

    const { error } = UserSchemaValidation.validate(body);

    if (error) {
      return { isValid: false, message: error.message }; // Return error message if validation fails
    }

    // If validation is successful
    return { isValid: true, message: "Validation successful" };
  } catch (err: any) {
    return { isValid: false, message: err.message };
  }
};
