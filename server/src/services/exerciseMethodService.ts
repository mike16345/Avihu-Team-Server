import { IExerciseMethod } from "../interfaces/IWorkoutPlan";
import { ExerciseMethodRepository } from "../repositories/Presets/ExerciseMethodRepository";
import { BaseService } from "./BaseService";

const RESOURCE_NAME = `exercise-methods`;

export default class ExerciseMethodService extends BaseService<
  IExerciseMethod,
  ExerciseMethodRepository
> {
  constructor() {
    super(new ExerciseMethodRepository(), RESOURCE_NAME);
  }
}
