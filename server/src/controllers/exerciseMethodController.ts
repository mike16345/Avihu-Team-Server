import ExerciseMethodService from "../services/exerciseMethodService";
import BaseController from "./BaseController";
import { IExerciseMethod } from "../interfaces/IWorkoutPlan";

export default class ExerciseMethodController extends BaseController<IExerciseMethod> {
  constructor() {
    super(new ExerciseMethodService());
  }
}
