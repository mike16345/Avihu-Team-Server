import { cardioWorkoutPreset } from "../models/cardioWorkoutmodel";
import { ICardioWorkout } from "../interfaces/IWorkoutPlan";
import { Cache } from "../utils/cache";

let cachedCardioWorkouts = new Cache<ICardioWorkout[]>();
let singleCardioWorkoutCache = new Cache<ICardioWorkout>();

export class CardioWorkoutService {
  static async getAllCardioWorkouts() {
    const cached = cachedCardioWorkouts.get("all");

    try {
      const allCardioWorkouts = cached || (await cardioWorkoutPreset.find());

      cachedCardioWorkouts.set(`all`, allCardioWorkouts);

      return allCardioWorkouts;
    } catch (error) {
      throw error;
    }
  }

  static async getCardioWorkoutById(id: string) {
    const cached = singleCardioWorkoutCache.get(id);

    try {
      const cardioWorkout = cached || (await cardioWorkoutPreset.findById(id));

      singleCardioWorkoutCache.set(id, cardioWorkout);

      return cardioWorkout;
    } catch (error) {
      throw error;
    }
  }

  static async addCardioWorkout(cardioWorkout: string) {
    try {
      const newCardioWorkout = await cardioWorkoutPreset.create(cardioWorkout);

      cachedCardioWorkouts.invalidate(`all`);

      return newCardioWorkout;
    } catch (error) {
      throw error;
    }
  }

  static async editCardioWorkout(cardioWorkout: any, id: string) {
    try {
      const newCardioWorkout = await cardioWorkoutPreset.findByIdAndUpdate(id, cardioWorkout, {
        new: true,
      });

      cachedCardioWorkouts.invalidate(`all`);
      singleCardioWorkoutCache.invalidate(id);

      return newCardioWorkout;
    } catch (error) {
      throw error;
    }
  }

  static async deleteCardioWorkout(id: string) {
    try {
      const deletedCardioWorkout = await cardioWorkoutPreset.findByIdAndDelete(id);

      cachedCardioWorkouts.invalidate(`all`);

      return deletedCardioWorkout;
    } catch (error) {
      throw error;
    }
  }
}
