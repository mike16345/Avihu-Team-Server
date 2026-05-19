import { isSystemLibraryOwner } from "../config/systemLibrary";
import { IExercisePreset } from "../interfaces/IWorkoutPlan";
import { ExercisePresetsRepository } from "../repositories/Presets/ExercisePresetsRepository";
import { requireTrainerAuthContext } from "../utils/authContext";
import { BaseService } from "./baseService";
import ExerciseLibraryAccessService from "./ExerciseLibraryAccessService";

const RESOURCE_NAME = "exercise-preset";

export class ExercisePresetService extends BaseService<IExercisePreset, ExercisePresetsRepository> {
  private exerciseLibraryAccessService: ExerciseLibraryAccessService;

  constructor() {
    super(new ExercisePresetsRepository(), RESOURCE_NAME);
    this.exerciseLibraryAccessService = new ExerciseLibraryAccessService();
  }

  private buildCreatePayload(payload: Partial<IExercisePreset>): IExercisePreset {
    const { trainerId } = requireTrainerAuthContext();
    const isSystemExercise = isSystemLibraryOwner(trainerId);

    return {
      name: payload.name!,
      linkToVideo: payload.linkToVideo!,
      muscleGroup: payload.muscleGroup!,
      imageUrl: payload.imageUrl,
      tipFromTrainer: payload.tipFromTrainer,
      libraryScope: isSystemExercise ? "system" : "private",
    };
  }

  async createExercisePreset(payload: Partial<IExercisePreset>): Promise<IExercisePreset> {
    const exercisePreset = await this.create(this.buildCreatePayload(payload));

    if (
      exercisePreset._id &&
      exercisePreset.trainerId &&
      isSystemLibraryOwner(exercisePreset.trainerId) &&
      exercisePreset.libraryScope === "system"
    ) {
      await this.exerciseLibraryAccessService
        .copyNewAvihuExerciseToAllEligibleTrainers(
          exercisePreset as IExercisePreset & { _id: NonNullable<IExercisePreset["_id"]> }
        )
        .catch((error) => {
          console.error("Failed to distribute new Avihu exercise preset", {
            exercisePresetId: exercisePreset._id?.toString(),
            error,
          });
        });
    }

    return exercisePreset;
  }
}
