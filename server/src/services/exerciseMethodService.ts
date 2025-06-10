import { IExerciseMethod } from "../interfaces/IWorkoutPlan";
import { ExerciseMethodRepository } from "../repositories/ExerciseMethods/ExerciseMethodRepository";
import { BaseService } from "./BaseService";

const RESOURCE_NAME = `exercise-methods`;

export default class ExerciseMethodService extends BaseService<IExerciseMethod> {
  constructor() {
    super(new ExerciseMethodRepository(), RESOURCE_NAME);
  }

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
    const newExerciseMethods = await Promise.all(
      exerciseMethods.map((e) => this.addExerciseMethod(e))
    );
    this.cache.invalidateAll();
    return newExerciseMethods;
  }

  async editExerciseMethod(exerciseMethod: IExerciseMethod, id: string) {
    return this.updateById(id, exerciseMethod);
  }

  async deleteExerciseMethod(id: string) {
    return this.deleteById(id);
  }
}
