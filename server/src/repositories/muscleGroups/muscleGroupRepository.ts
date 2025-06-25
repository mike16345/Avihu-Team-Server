import { IMuscleGroup } from "../../interfaces/IWorkoutPlan";
import { muscleGroupPresets } from "../../models/muscleGroupModel";
import { BaseRepository } from "../BaseRepository";

export class MuscleGroupRepository extends BaseRepository<IMuscleGroup> {
  constructor() {
    super(muscleGroupPresets);
  }
}
