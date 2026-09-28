import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { exercisePresetValidationSchema } from "../models/exercisePresetModel";
import { ExercisePresetService } from "../services/exercisePresetService";
import { FIND_ONE_FAILURE } from "../constants/repository";
import { validateAndSanitizeBody } from "../utils/utils";

export const validateExercise = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<{ isValid: boolean; message?: string; validatedExercise?: any }> => {
  const { id } = event.queryStringParameters || {};

  try {
    const validation = validateAndSanitizeBody(event, exercisePresetValidationSchema);
    if (!validation.isValid) {
      return { isValid: false, message: validation.message };
    }
    const exercise = validation.validatedBody;

    if (!id) {
      const exerciseExists = await new ExercisePresetService().findOne({ name: exercise.name });

      if (exerciseExists) {
        return { isValid: false, message: "תרגיל כבר קיים במערכת" }; // Exercise already exists in the system
      }
    }

    // Validation passed
    return { isValid: true, validatedExercise: exercise };
  } catch (err: any) {
    if (err.message == FIND_ONE_FAILURE) return { isValid: true };

    return { isValid: false, message: "An error occurred during validation" };
  }
};
