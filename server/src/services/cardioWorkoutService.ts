import { ICardioWorkout } from "../interfaces/IWorkoutPlan";
import { BaseService } from "./BaseService";
import { CardioWorkoutRepository } from "../repositories/Presets/CardioWorkoutRepository";

const RESOURCE_NAME = "cardio-workout";

export class CardioWorkoutService extends BaseService<ICardioWorkout> {
  constructor() {
    super(new CardioWorkoutRepository(), RESOURCE_NAME);
  }
}
