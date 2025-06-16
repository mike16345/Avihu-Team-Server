import { IExercisePreset } from "../interfaces/IWorkoutPlan";
import { ExerciseRepository } from "../repositories/Exercises/ExerciseRepository";
import { BaseService } from "./baseService";

const RESOURCE_NAME = "exercise-preset";

export class ExercisePresetService extends BaseService<IExercisePreset> {
  constructor() {
    super(new ExerciseRepository(), RESOURCE_NAME);
  }
}
