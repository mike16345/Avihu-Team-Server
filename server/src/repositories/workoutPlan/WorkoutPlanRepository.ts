import { Types } from "mongoose";
import { IFullWorkoutPlan } from "../../interfaces/IWorkoutPlan";
import { exercisePresets } from "../../models/exercisePresetModel";
import { WorkoutPlan } from "../../models/workoutPlanModel";
import { FindOptions } from "../../types/mongooseTypes";
import { BaseRepository } from "../BaseRepository";
import { FIND_ONE_FAILURE } from "../../constants/repository";
import { StatusCode } from "../../enums/StatusCode";

export class WorkoutPlanRepository extends BaseRepository<IFullWorkoutPlan> {
  constructor() {
    super(WorkoutPlan);
  }

  private populateWorkoutPlan(
    query: ReturnType<
      typeof this.model.find | typeof this.model.findOne | typeof this.model.findById
    >
  ) {
    return query.populate({
      path: "workoutPlans.muscleGroups.exercises.exerciseId",
      select: "name linkToVideo",
      model: exercisePresets,
    });
  }

  async findOne(options: FindOptions<IFullWorkoutPlan>): Promise<any> {
    const { query, queryOptions, projection } = options;
    const queryResult = this.model.findOne(query, projection, queryOptions);

    const plan = await this.populateWorkoutPlan(queryResult);

    if (!plan) {
      throw { status: StatusCode.NOT_FOUND, message: FIND_ONE_FAILURE };
    }

    return plan;
  }

  async findById(id: string | Types.ObjectId): Promise<any> {
    const plan = await this.populateWorkoutPlan(this.model.findById(id));

    if (!plan) {
      throw { status: StatusCode.NOT_FOUND, message: FIND_ONE_FAILURE };
    }

    return plan;
  }

  async find(options: FindOptions<IFullWorkoutPlan>): Promise<any> {
    const { query, queryOptions, projection } = options;
    const plans = await this.populateWorkoutPlan(this.model.find(query, projection, queryOptions));

    return plans;
  }
}
