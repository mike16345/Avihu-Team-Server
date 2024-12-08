import { UserSchemaValidation } from "../models/userModel";
import { APIGatewayProxyEvent } from "aws-lambda";
import { Context } from "aws-sdk/clients/autoscaling";
import UserService from "../services/userService";

export const validateUser = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<{ isValid: boolean; message?: string }> => {
  const body = JSON.parse(event.body || "{}"); // Parse the JSON body
  const email = body.email;
  const phone = body.phone;

  try {
    const users = await UserService.getUsersByParameter({ email, phone });

    for (const user of users) {
      if (user.email === email) return { isValid: false, message: "כתובת מייל בשימוש!" };
      if (user.phone === phone) return { isValid: false, message: "מספר טלפון בשימוש!" };
    }

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
