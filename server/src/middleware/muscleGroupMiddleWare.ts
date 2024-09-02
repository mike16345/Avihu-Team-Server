import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { muscleGroupPresets } from "../models/muscleGroupModel";
import { StatusCode } from "../enums/StatusCode";

export const checkIfMuscleGroupExists = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<{ isValid: boolean; message?: string }> => {
  const muscleGroup = JSON.parse(event.body || "{}").name;

  try {
    const itemExists = await muscleGroupPresets.findOne({ name: muscleGroup });

    if (itemExists) {
      return { isValid: false, message: "קבוצת שריר כבר קיימת במערכת" }; // Muscle group already exists
    }

    // If no conflicts, proceed
    return { isValid: true };
  } catch (err: any) {
    return { isValid: false, message: "An error occurred during muscle group validation" };
  }
};
