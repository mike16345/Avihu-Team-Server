import { IExerciseMethod } from "../../interfaces/IWorkoutPlan";
import { BaseRepository } from "../BaseRepository";
import { exerciseMethods } from "../../models/excerciseMethodModel";

export class ExerciseMethodRepository extends BaseRepository<IExerciseMethod> {
  constructor() {
    super(exerciseMethods);
  }
}
