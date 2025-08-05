import { UserSchemaValidation } from "../models/userModel";
import { APIGatewayProxyEvent } from "aws-lambda";
import UserService from "../services/userService";
import { extractBodyFromEvent } from "../utils/utils";
import { StatusCode } from "../enums/StatusCode";
import UserRepository from "../repositories/User/UserRepository";

const isUserExists = async (email: string, phone: string) => {
  try {
    const user = await new UserRepository().findOne({ query: { $or: [{ email }, { phone }] } });
    if (!user) return false;

    if (user.email === email) return { isValid: false, message: "כתובת מייל בשימוש!" };
    if (user.phone === phone) return { isValid: false, message: "מספר טלפון בשימוש!" };
  } catch (error: any) {
    if (error.status == StatusCode.NOT_FOUND) {
      return false;
    }
  }
};

export const validateUser = async (
  event: APIGatewayProxyEvent
): Promise<{ isValid: boolean; message?: string }> => {
  const body = extractBodyFromEvent(event);
  const email = body.email;
  const phone = body.phone;

  try {
    const userExists = await isUserExists(email, phone);
    if (userExists) {
      return userExists;
    }

    const { error } = UserSchemaValidation.validate(body);

    if (error) {
      return { isValid: false, message: error.message };
    }

    // If validation is successful
    return { isValid: true, message: "Validation successful" };
  } catch (err: any) {
    return { isValid: false, message: err.message };
  }
};
