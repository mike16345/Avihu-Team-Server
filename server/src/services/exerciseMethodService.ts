import { IExerciseMethod } from "../interfaces/IWorkoutPlan";
import { ExerciseMethodRepository } from "../repositories/ExerciseMethods/ExerciseMethodRepository";
import { BaseService } from "./BaseService";

const RESOURCE_NAME = `exercise-methods`;

export default class ExerciseMethodService extends BaseService<IExerciseMethod> {
  constructor() {
    super(new ExerciseMethodRepository(), RESOURCE_NAME);
  }

  async getAllExerciseMethods() {
    return await  this.find();
  }

  async getPaginatedMethods(limit: number, page: number, query: any, sort: Record<string, any>) {
    return await this.findPaginated({ limit, page, sort, query }, RESOURCE_NAME);
  }

  async getExerciseMethodById(id: string) {
    return await this.findById(id);
  }

  async getExerciseMethodByName(name: string) {
    return await this.findOne({ title: name });
  }

  async addExerciseMethod(exerciseMethod: IExerciseMethod) {
    return await this.create(exerciseMethod);
  }

  async addManyExerciseMethods(exerciseMethods: IExerciseMethod[]) {
    const newExerciseMethods = await Promise.all(
      exerciseMethods.map((e) => this.addExerciseMethod(e))
    );
    this.cache.invalidateAll();
    return newExerciseMethods;
  }

  async editExerciseMethod(exerciseMethod: IExerciseMethod, id: string) {
    return await this.updateById(id, exerciseMethod);
  }

  async deleteExerciseMethod(id: string) {
    return await this.deleteById(id);
  }
}
