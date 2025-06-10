import { IExerciseMethod } from "../interfaces/IWorkoutPlan";
import { exerciseMethods } from "../models/excerciseMethodModel";
import { BaseService } from "./baseService";

const RESOURCE_NAME = `exercise-methods`;

class ExerciseMethodService extends BaseService<IExerciseMethod> {
  async getAllExerciseMethods() {
    return this.find();
  }

  async getPaginatedMethods(limit: number, page: number, query: any, sort: Record<string, any>) {
    return this.findPaginated({ limit, page, sort, query }, RESOURCE_NAME);
  }

  async getExerciseMethodById(id: string) {
    return this.findById(id);
  }

  async getExerciseMethodByName(name: string) {
    return this.findOne({ title: name });
  }

  async addExerciseMethod(exerciseMethod: IExerciseMethod) {
    return this.create(exerciseMethod);
  }

  async addManyExerciseMethods(exerciseMethods: IExerciseMethod[]) {
    // Using Promise.all and this.addExerciseMethod with instance method (not static)
    const newExerciseMethods = await Promise.all(
      exerciseMethods.map((e) => this.addExerciseMethod(e))
    );
    this.cache.invalidateAll(); // Clear cache after adding many
    return newExerciseMethods;
  }

  async editExerciseMethod(exerciseMethod: IExerciseMethod, id: string) {
    return this.updateById(id, exerciseMethod);
  }

  async deleteExerciseMethod(id: string) {
    return this.deleteById(id);
  }
}

export default new ExerciseMethodService(exerciseMethods, RESOURCE_NAME);
