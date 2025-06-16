import { ExercisePresetService } from "../services/exercisePresetService";
import BaseController from "./BaseController";
import { IExercisePreset } from "../interfaces/IWorkoutPlan";

export class ExercisePresetController extends BaseController<IExercisePreset> {
  constructor() {
    super(new ExercisePresetService());
  }
}
