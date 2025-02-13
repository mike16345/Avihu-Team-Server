import { IExerciseMethod } from "../interfaces/IWorkoutPlan";
import { exerciseMethods } from "../models/excerciseMethodModel";
import { Cache } from "../utils/cache";

let cachedExerciseMethods = new Cache<IExerciseMethod[]>();
let singleExerciseMethodCache = new Cache<IExerciseMethod>();

export class ExerciseMethodService {
  static async getAllExerciseMethods() {
    const cached= cachedExerciseMethods.get(`all`)
    try {
      const allExerciseMethods = cached ||(await exerciseMethods.find());
      cachedExerciseMethods.set(`all`,allExerciseMethods)

      return allExerciseMethods;
    } catch (error) {
      throw error;
    }
  }

  static async getexErciseMethodById(id: string) {
    const cached= singleExerciseMethodCache.get(id)
    try {
      const exerciseMethod = cached||(await exerciseMethods.findById(id));
      singleExerciseMethodCache.set(id,exerciseMethod)

      return exerciseMethod;
    } catch (error) {
      throw error;
    } 
  }

  static async getexErciseMethodByName(name: string) {
    const cached= singleExerciseMethodCache.get(name)
    try {
      const exerciseMethod = cached||((await exerciseMethods.find({title:name})).pop());
      singleExerciseMethodCache.set(name,exerciseMethod)

      return exerciseMethod;
    } catch (error) {
      throw error;
    } 
  }

  static async addExerciseMethod(exerciseMethod: IExerciseMethod) {
    try {
      const newExerciseMethod = await exerciseMethods.create(exerciseMethod);
      cachedExerciseMethods.invalidateAll()

      return newExerciseMethod;
    } catch (error) {
      throw error;
    }
  }
  static async addManyExerciseMethods(exerciseMethods: IExerciseMethod[]) {
    try {
      const newExrciseMethods = await Promise.all(
        exerciseMethods.map(async (e) => {
          return await ExerciseMethodService.addExerciseMethod(e);
        })
      );

      cachedExerciseMethods.invalidateAll()

      return newExrciseMethods;
    } catch (error) {
      throw error;
    }
  }

  static async editExerciseMethod(exerciseMethod: IExerciseMethod, id: string) {
    try {
      const newExerciseMethod = await exerciseMethods.findByIdAndUpdate(id, exerciseMethod, {
        new: true,
      });

      if (newExerciseMethod){
        cachedExerciseMethods.invalidateAll()
        singleExerciseMethodCache.invalidate(id)
      }

      return newExerciseMethod;
    } catch (error) {
      throw error;
    }
  }

  static async deleteExerciseMethod(id: string) {
    try {
      const deletedExerciseMethod = await exerciseMethods.findByIdAndDelete(id);

      if (deletedExerciseMethod){
        cachedExerciseMethods.invalidateAll()
        singleExerciseMethodCache.invalidate(id)
      }

      return deletedExerciseMethod;
    } catch (error) {
      throw error;
    }
  }
}
