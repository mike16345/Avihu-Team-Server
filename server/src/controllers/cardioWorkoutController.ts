import { CardioWorkoutService } from "../services/cardioWorkoutService";
import BaseController from "./BaseController";
import { ICardioWorkout } from "../interfaces/IWorkoutPlan";

export default class CardioWorkoutController extends BaseController<ICardioWorkout> {
  constructor(){
    super(new CardioWorkoutService());
  }
}
