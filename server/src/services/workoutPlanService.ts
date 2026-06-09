import { IFullWorkoutPlan } from "../interfaces/IWorkoutPlan";
import { workoutPlanRepository } from "../repositories/workoutPlan/WorkoutPlanRepository";
import { removeNestedIds } from "../utils/utils";
import { sanitizeWorkoutPlanForInsert } from "../utils/workoutPlanUtils";
import { BaseService } from "./baseService";

const RESOURCE_NAME = `workout-plan`;

export class WorkoutPlanService extends BaseService<
  IFullWorkoutPlan,
  typeof workoutPlanRepository
> {
  constructor() {
    super(workoutPlanRepository, RESOURCE_NAME);
  }

  addWorkoutPlan = async (workoutPlan: IFullWorkoutPlan) => {
    const plan = sanitizeWorkoutPlanForInsert(workoutPlan) as IFullWorkoutPlan;
    const cleanedPlan = removeNestedIds(plan);
    const newPlan = await this.repository.create(cleanedPlan);

    return newPlan;
  };

  updateWorkoutPlan = async (workoutPlan: IFullWorkoutPlan, userId: string) => {
    const plan = sanitizeWorkoutPlanForInsert(workoutPlan);
    const cleanedPlan = removeNestedIds(plan);
    // Only update the ACTIVE plan (archivedAt: null). Historical docs
    // are immutable — editing them would silently rewrite history.
    const updatedPlan = await this.repository.updateOne({
      filter: { userId, archivedAt: null },
      update: cleanedPlan,
    });

    return updatedPlan;
  };

  // ---------------------------------------------------------------
  // Plan history / temporary-swap support.
  //
  // Invariant: at most ONE doc per `userId` has `archivedAt = null`
  // at any time. Mobile reads `findOne({userId, archivedAt: null})`
  // — no change to the data shape the app expects.
  // ---------------------------------------------------------------

  /** Returns all archived plan docs for the user, newest first. */
  getHistoryForUser = async (userId: string) => {
    return this.repository.find({
      query: { userId, archivedAt: { $ne: null } },
      queryOptions: { sort: { assignedAt: -1 } },
    });
  };

  /**
   * Atomically archive the current active plan + insert a new one.
   * Sequential ops (not a Mongo transaction) — production cluster
   * may not be a replica set. Worst case is a brief "two active docs"
   * window which self-collapses on the next operation.
   */
  swapWorkoutPlan = async (
    userId: string,
    newPlan: Partial<IFullWorkoutPlan> & { assignedBy?: string }
  ) => {
    let currentPlan: any = null;
    try {
      currentPlan = await this.repository.findOne({
        query: { userId, archivedAt: null },
      });
    } catch {
      // No active plan yet — fine, just create a new one below.
    }

    const sanitized = sanitizeWorkoutPlanForInsert({
      ...newPlan,
      userId,
      archivedAt: null,
      assignedAt: new Date(),
    } as IFullWorkoutPlan);
    const cleanedPlan = removeNestedIds(sanitized);
    delete (cleanedPlan as any)._id;

    const newDoc = await this.repository.create(cleanedPlan);

    if (currentPlan?._id) {
      await this.repository.updateById({
        id: currentPlan._id,
        update: {
          archivedAt: new Date(),
          replacedByPlanId: (newDoc as any)._id,
        } as any,
      });
    }

    return newDoc;
  };

  /**
   * Restore an archived plan to active. Always creates a NEW active
   * doc cloned from the archived one — never resurrect the archived
   * doc itself, so the timeline stays append-only.
   */
  restoreWorkoutPlan = async (
    userId: string,
    archivedPlanId: string,
    assignedBy?: string
  ) => {
    const archived: any = await this.repository.findById(archivedPlanId);
    if (!archived || archived.userId !== userId) {
      throw new Error("Archived plan not found for this user");
    }

    const archivedObj =
      typeof archived.toObject === "function" ? archived.toObject() : archived;
    const {
      _id,
      archivedAt,
      replacedByPlanId,
      temporaryUntil,
      restoreToPlanId,
      assignedAt,
      createdAt,
      updatedAt,
      ...body
    } = archivedObj;

    const restoredPlan = {
      ...body,
      userId,
      assignedBy,
      assignmentLabel: `שחזור: ${archived.assignmentLabel || ""}`.trim(),
    };

    return this.swapWorkoutPlan(userId, restoredPlan as any);
  };
}
