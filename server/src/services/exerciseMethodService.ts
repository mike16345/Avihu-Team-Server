import { IExerciseMethod } from "../interfaces/IWorkoutPlan";
import { exerciseMethods } from "../models/excerciseMethodModel";
import { PaginationParams } from "../utils/pagination";
import { BaseService } from "./baseService";

const RESOURCE_NAME = `exercise-methods`;

class ExerciseMethodService extends BaseService<IExerciseMethod> {
  async getAllExerciseMethods() {
    try {
      const allExerciseMethods = await this.findAll(exerciseMethods, `${RESOURCE_NAME}-all`);

      return allExerciseMethods;
    } catch (error) {
      throw error;
    }
  }

  async getPaginatedMethods(limit: number, page: number, query: any, sort: Record<string, any>) {
    try {
      const paginatedData = await this.findPaginated(
        { model: exerciseMethods, limit, page, sort, query },
        RESOURCE_NAME
      );

      return paginatedData;
    } catch (error) {
      throw error;
    }
  }

  async getexErciseMethodById(id: string) {
    try {
      const exerciseMethod = await this.findById(id, exerciseMethods, `${RESOURCE_NAME}-${id}`);

      return exerciseMethod;
    } catch (error) {
      throw error;
    }
  }

  async getExerciseMethodByName(name: string) {
    try {
      const exerciseMethod = await this.findOne(
        { title: name },
        exerciseMethods,
        `${RESOURCE_NAME}-${name}`
      );

      return exerciseMethod;
    } catch (error) {
      throw error;
    }
  }

  async addExerciseMethod(exerciseMethod: IExerciseMethod) {
    try {
      const newExerciseMethod = await this.create(exerciseMethod, exerciseMethods);

      return newExerciseMethod;
    } catch (error) {
      throw error;
    }
  }

  async addManyExerciseMethods(exerciseMethods: IExerciseMethod[]) {
    try {
      const newExrciseMethods = await Promise.all(
        exerciseMethods.map(async (e) => {
          return await ExerciseMethodService.addExerciseMethod(e);
        })
      );

      this.cache.invalidateAll();

      return newExrciseMethods;
    } catch (error) {
      throw error;
    }
  }

  async editExerciseMethod(exerciseMethod: IExerciseMethod, id: string) {
    try {
      const newExerciseMethod = await this.update(id, exerciseMethod, exerciseMethods);

      return newExerciseMethod;
    } catch (error) {
      throw error;
    }
  }

  async deleteExerciseMethod(id: string) {
    try {
      const deletedExerciseMethod = await this.delete(id, exerciseMethods);

      return deletedExerciseMethod;
    } catch (error) {
      throw error;
    }
  }
}

export default new ExerciseMethodService();
