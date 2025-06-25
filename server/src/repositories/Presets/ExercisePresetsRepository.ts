import { IExercisePreset } from "../../interfaces/IWorkoutPlan";
import { exercisePresets } from "../../models/exercisePresetModel";
import { BaseRepository } from "../BaseRepository";

export class ExercisePresetsRepository extends BaseRepository<IExercisePreset> {
  constructor() {
    super(exercisePresets);
  }
}
