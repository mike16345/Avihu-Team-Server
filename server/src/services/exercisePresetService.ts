import { IExercisePreset } from "../interfaces/IWorkoutPlan";
import { ExercisePresetsRepository } from "../repositories/Presets/ExercisePresetsRepository";
import { BaseService } from "./BaseService";

const RESOURCE_NAME = "exercise-preset";

export class ExercisePresetService extends BaseService<IExercisePreset, ExercisePresetsRepository> {
  constructor() {
    super(new ExercisePresetsRepository(), RESOURCE_NAME);
  }
}
