import mongoose, { AnyBulkWriteOperation } from "mongoose";
import { getSystemLibraryOwnerObjectId, isSystemLibraryOwner } from "../config/systemLibrary";
import { IExercisePreset } from "../interfaces/IWorkoutPlan";
import { TrainerModel } from "../models/trainerModel";
import { exercisePresets } from "../models/exercisePresetModel";

type ExerciseSourceDocument = IExercisePreset & {
  _id: mongoose.Types.ObjectId;
};

const toObjectId = (trainerId: string | mongoose.Types.ObjectId) =>
  typeof trainerId === "string" ? new mongoose.Types.ObjectId(trainerId) : trainerId;

export const buildExerciseCopyForTrainer = (
  sourceExercise: ExerciseSourceDocument,
  trainerId: string | mongoose.Types.ObjectId
) => ({
  name: sourceExercise.name,
  linkToVideo: sourceExercise.linkToVideo,
  muscleGroup: sourceExercise.muscleGroup,
  imageUrl: sourceExercise.imageUrl,
  tipFromTrainer: sourceExercise.tipFromTrainer,
  trainerId: toObjectId(trainerId),
  libraryScope: "private" as const,
  sourceExerciseId: sourceExercise._id,
  sourceOwnerId: getSystemLibraryOwnerObjectId(),
});

export default class ExerciseLibraryAccessService {
  async ensureAvihuLibraryToTrainer(trainerId: string | mongoose.Types.ObjectId) {
    if (isSystemLibraryOwner(trainerId)) {
      return null;
    }

    const targetTrainerId = toObjectId(trainerId);
    const sourceExercises = await exercisePresets
      .find({
        trainerId: getSystemLibraryOwnerObjectId(),
        libraryScope: "system",
      })
      .lean<ExerciseSourceDocument[]>();

    if (sourceExercises.length === 0) {
      return null;
    }

    const sourceExerciseIds = sourceExercises.map(({ _id }) => _id);
    const existingCopiedSourceExerciseIds = await exercisePresets.distinct("sourceExerciseId", {
      trainerId: targetTrainerId,
      sourceOwnerId: getSystemLibraryOwnerObjectId(),
      sourceExerciseId: { $in: sourceExerciseIds },
    });

    if (existingCopiedSourceExerciseIds.length >= sourceExerciseIds.length) {
      return null;
    }

    const operations = sourceExercises.map((sourceExercise) =>
      this.buildCopyUpsertOperation(sourceExercise, targetTrainerId)
    );

    return exercisePresets.bulkWrite(operations, { ordered: false });
  }

  async copyAvihuLibraryToTrainer(trainerId: string | mongoose.Types.ObjectId) {
    if (isSystemLibraryOwner(trainerId)) {
      return null;
    }

    const sourceExercises = await exercisePresets
      .find({
        trainerId: getSystemLibraryOwnerObjectId(),
        libraryScope: "system",
      })
      .lean<ExerciseSourceDocument[]>();

    if (sourceExercises.length === 0) {
      return null;
    }

    const operations = sourceExercises.map((sourceExercise) =>
      this.buildCopyUpsertOperation(sourceExercise, trainerId)
    );

    return exercisePresets.bulkWrite(operations, { ordered: false });
  }

  async copyAvihuExerciseToTrainer(
    sourceExercise: ExerciseSourceDocument,
    trainerId: string | mongoose.Types.ObjectId
  ) {
    if (isSystemLibraryOwner(trainerId)) {
      return null;
    }

    const copy = buildExerciseCopyForTrainer(sourceExercise, trainerId);

    return exercisePresets.updateOne(
      {
        trainerId: copy.trainerId,
        sourceExerciseId: copy.sourceExerciseId,
      },
      {
        $setOnInsert: copy,
      },
      {
        upsert: true,
      }
    );
  }

  async copyNewAvihuExerciseToAllEligibleTrainers(sourceExercise: ExerciseSourceDocument) {
    if (
      !isSystemLibraryOwner(sourceExercise.trainerId) ||
      sourceExercise.libraryScope !== "system"
    ) {
      return null;
    }

    const eligibleTrainers = await TrainerModel.find(
      {
        isDeleted: false,
        videoLibraryAccess: true,
        _id: { $ne: getSystemLibraryOwnerObjectId() },
      },
      { _id: 1 }
    ).lean<{ _id: mongoose.Types.ObjectId }[]>();

    if (eligibleTrainers.length === 0) {
      return null;
    }

    const operations = eligibleTrainers.map((trainer) =>
      this.buildCopyUpsertOperation(sourceExercise, trainer._id)
    );

    return exercisePresets.bulkWrite(operations, { ordered: false });
  }

  private buildCopyUpsertOperation(
    sourceExercise: ExerciseSourceDocument,
    trainerId: string | mongoose.Types.ObjectId
  ): AnyBulkWriteOperation {
    const copy = buildExerciseCopyForTrainer(sourceExercise, trainerId);

    return {
      updateOne: {
        filter: {
          trainerId: copy.trainerId,
          sourceExerciseId: copy.sourceExerciseId,
        },
        update: {
          $setOnInsert: copy,
        },
        upsert: true,
      },
    };
  }
}
