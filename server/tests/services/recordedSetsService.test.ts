import mongoose from "mongoose";
import { RecordedSetsService } from "../../src/services/recordedSetsService";
import { MuscleGroupRecordedSets } from "../../src/models/recordedSetsModel";

describe("RecordedSetsService", () => {
  test("writes exerciseKeyToId and canonical key", async () => {
    const service = new RecordedSetsService();
    const userId = new mongoose.Types.ObjectId().toHexString();
    const exerciseId = new mongoose.Types.ObjectId();
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not initialized");
    }
    await db.collection("exercises").insertOne({
      _id: exerciseId,
      name: "Bench Press",
    });

    await service.addRecordedSets(userId, "Chest", "Old Name", exerciseId.toHexString(), null, [
      {
        plan: "Plan A",
        exercise: "Old Name",
        setNumber: 1,
        weight: 100,
        repsDone: 8,
        note: "",
        date: new Date(),
      },
    ]);

    const record = await MuscleGroupRecordedSets.findOne({ userId, muscleGroup: "Chest" }).lean();

    expect(record?.recordedSets?.["Bench Press"]).toHaveLength(1);
    expect(record?.exerciseKeyToId?.["Old Name"]).toBe(exerciseId.toHexString());
    expect(record?.exerciseKeyToId?.["Bench Press"]).toBe(exerciseId.toHexString());
  });

  test("logs warning on mismatched canonical exercise name", async () => {
    const service = new RecordedSetsService();
    const userId = new mongoose.Types.ObjectId().toHexString();
    const exerciseId = new mongoose.Types.ObjectId();
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not initialized");
    }
    await db.collection("exercises").insertOne({
      _id: exerciseId,
      name: "Bench Press",
    });

    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    await service.addRecordedSets(userId, "Chest", "Old Name", exerciseId.toHexString(), null, [
      {
        plan: "Plan A",
        exercise: "Old Name",
        setNumber: 1,
        weight: 100,
        repsDone: 8,
        note: "",
        date: new Date(),
      },
    ]);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        service: "RecordedSetsService.addRecordedSets",
        userId,
        muscleGroup: "Chest",
        exerciseId: exerciseId.toHexString(),
        receivedExerciseKey: "Old Name",
        canonicalExerciseName: "Bench Press",
        sessionId: null,
        timestamp: expect.any(String),
      })
    );

    warnSpy.mockRestore();
  });
});
