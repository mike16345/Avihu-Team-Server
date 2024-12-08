import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { exercisePresetValidationSchema } from "../models/exercisePresetModel";
import { ExercisePresetService } from "../services/exercisePresetService";

export const validateExercise = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<{ isValid: boolean; message?: string; validatedExercise?: any }> => {
  const exercise = JSON.parse(event.body || "{}");
  const { id } = event.queryStringParameters || {};

  try {
    const { error } = exercisePresetValidationSchema.validate(exercise);
    if (error) {
      return { isValid: false, message: error.message };
    }

    if (!id) {
      const exerciseExists = await ExercisePresetService.getExerciseByName(exercise.name);
      if (exerciseExists) {
        return { isValid: false, message: "תרגיל כבר קיים במערכת" }; // Exercise already exists in the system
      }
    }

    delete exercise._id;
    delete exercise.__v;

    // Validation passed
    return { isValid: true, validatedExercise: exercise };
  } catch (err: any) {
    return { isValid: false, message: "An error occurred during validation" };
  }
};
