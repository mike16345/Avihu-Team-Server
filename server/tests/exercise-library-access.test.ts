jest.mock("../src/utils/pagination", () => ({
  generatePaginationCacheKey: jest.fn(() => "exercise-library-test-cache-key"),
}));

jest.mock("../src/utils/utils", () => ({
  stableStringify: jest.fn(() => "{}"),
  deleteUserDataFromAllCollections: jest.fn(),
}));

import mongoose from "mongoose";
import {
  TRAINER_SOURCES,
  TRAINER_STATUSES,
  TRAINER_SUBSCRIPTION_PLANS,
} from "../src/interfaces/ITrainer";
import { exercisePresets } from "../src/models/exercisePresetModel";
import { TrainerModel } from "../src/models/trainerModel";
import ExerciseLibraryAccessService from "../src/services/ExerciseLibraryAccessService";
import { ExercisePresetService } from "../src/services/exercisePresetService";
import { runWithAuthContext } from "../src/utils/authContext";

const AVIHU_TRAINER_ID = "12345";

const createTrainer = async ({
  _id = new mongoose.Types.ObjectId(),
  videoLibraryAccess = false,
}: {
  _id?: mongoose.Types.ObjectId | string;
  videoLibraryAccess?: boolean;
} = {}) =>
  TrainerModel.create({
    _id,
    fullName: `Trainer ${String(_id).slice(-4)}`,
    email: `trainer-${String(_id).slice(-6)}@example.com`,
    phone: `+9725000${String(_id).slice(-5)}`,
    subscriptionPlan: TRAINER_SUBSCRIPTION_PLANS[0],
    clientLimit: 10,
    subTrainerLimit: 2,
    status: TRAINER_STATUSES[0],
    source: TRAINER_SOURCES[0],
    videoLibraryAccess,
  });

describe("Exercise library access", () => {
  beforeEach(() => {
    process.env.AVIHU_TRAINER_ID = AVIHU_TRAINER_ID;
  });

  test("copyAvihuLibraryToTrainer copies Avihu system exercises once per target trainer", async () => {
    const targetTrainer = await createTrainer({ videoLibraryAccess: true });

    const avihuSystemExercise = await exercisePresets.create({
      trainerId: AVIHU_TRAINER_ID,
      name: "Avihu Bench Press",
      linkToVideo: "https://youtube.com/watch?v=benchpressdemo1",
      muscleGroup: "Chest",
      imageUrl: "https://example.com/bench.png",
      tipFromTrainer: "Drive through the floor.",
      libraryScope: "system",
    });

    await exercisePresets.create({
      trainerId: AVIHU_TRAINER_ID,
      name: "Avihu Private Exercise",
      linkToVideo: "https://youtube.com/watch?v=privateexercise1",
      muscleGroup: "Back",
      libraryScope: "private",
    });

    const service = new ExerciseLibraryAccessService();

    await service.copyAvihuLibraryToTrainer(targetTrainer._id);
    await service.copyAvihuLibraryToTrainer(targetTrainer._id);

    const copies = await exercisePresets.find({ trainerId: targetTrainer._id }).lean<
      {
        trainerId: mongoose.Types.ObjectId;
        sourceExerciseId: mongoose.Types.ObjectId;
        sourceOwnerId: mongoose.Types.ObjectId;
        libraryScope: string;
        name: string;
      }[]
    >();

    expect(copies).toHaveLength(1);
    expect(String(copies[0].trainerId)).toBe(String(targetTrainer._id));
    expect(copies[0].libraryScope).toBe("private");
    expect(String(copies[0].sourceExerciseId)).toBe(String(avihuSystemExercise._id));
    expect(String(copies[0].sourceOwnerId)).toBe(AVIHU_TRAINER_ID);
    expect(copies[0].name).toBe("Avihu Bench Press");
  });

  test("trainer-created exercise does not distribute and cannot self-mark as system", async () => {
    const normalTrainer = await createTrainer();
    const eligibleTrainer = await createTrainer({ videoLibraryAccess: true });
    const exercisePresetService = new ExercisePresetService();

    const createdExercise = await runWithAuthContext(
      { trainerId: normalTrainer._id.toString(), role: "trainer" },
      async () =>
        exercisePresetService.createExercisePreset({
          name: "Trainer Push Up",
          linkToVideo: "https://youtube.com/watch?v=trainerpushup1",
          muscleGroup: "Chest",
          libraryScope: "system",
        })
    );

    const eligibleCopies = await exercisePresets.find({ trainerId: eligibleTrainer._id }).lean();

    expect(createdExercise.libraryScope).toBe("private");
    expect(createdExercise.sourceExerciseId).toBeUndefined();
    expect(eligibleCopies).toHaveLength(0);
  });

  test("Avihu system exercise distributes only to trainers with videoLibraryAccess", async () => {
    await createTrainer({ _id: AVIHU_TRAINER_ID });
    const eligibleTrainer = await createTrainer({ videoLibraryAccess: true });
    const ineligibleTrainer = await createTrainer({ videoLibraryAccess: false });
    const exercisePresetService = new ExercisePresetService();

    const createdExercise = await runWithAuthContext(
      { trainerId: AVIHU_TRAINER_ID, role: "trainer" },
      async () =>
        exercisePresetService.createExercisePreset({
          name: "Avihu Split Squat",
          linkToVideo: "https://youtube.com/watch?v=splitsquatdemo1",
          muscleGroup: "Legs",
          libraryScope: "system",
        })
    );

    const eligibleCopies = await exercisePresets.find({ trainerId: eligibleTrainer._id }).lean();
    const ineligibleCopies = await exercisePresets
      .find({ trainerId: ineligibleTrainer._id })
      .lean();

    expect(createdExercise.libraryScope).toBe("system");
    expect(eligibleCopies).toHaveLength(1);
    expect(String(eligibleCopies[0].trainerId)).toBe(String(eligibleTrainer._id));
    expect(eligibleCopies[0].libraryScope).toBe("private");
    expect(String(eligibleCopies[0].sourceExerciseId)).toBe(String(createdExercise._id));
    expect(String(eligibleCopies[0].sourceOwnerId)).toBe(AVIHU_TRAINER_ID);
    expect(ineligibleCopies).toHaveLength(0);
  });
});
