import mongoose from "mongoose";
import { auditDietPlanV2Migration } from "../scripts/auditDietPlanV2Migration";
import { DIET_PLANS_COLLECTION } from "../src/models/dietPlanModel";
import { DIET_PLAN_PRESETS_COLLECTION } from "../src/models/dietPlanPresetModel";

describe("Diet Plan V2 migration audit", () => {
  test("reports a safe, fully versioned state without mutating it", async () => {
    const plans = mongoose.connection.collection(DIET_PLANS_COLLECTION);
    const presets = mongoose.connection.collection(DIET_PLAN_PRESETS_COLLECTION);
    const trainerId = new mongoose.Types.ObjectId();
    await plans.insertMany([
      { userId: "user-1", version: 1, meals: [] },
      { userId: "user-2", version: 2, trainerId, meals: [], highlights: "" },
    ]);
    await presets.insertMany([
      { name: "Legacy", normalizedName: "legacy", version: 1, trainerId, meals: [] },
      { name: "Modern", normalizedName: "modern", version: 2, trainerId, meals: [] },
    ]);
    const beforePlanCount = await plans.countDocuments();
    const beforePresetCount = await presets.countDocuments();

    const report = await auditDietPlanV2Migration(mongoose.connection);

    expect(report.safeToMigrate).toBe(true);
    expect(report.collections).toEqual({
      dietPlans: DIET_PLANS_COLLECTION,
      dietPlanPresets: DIET_PLAN_PRESETS_COLLECTION,
    });
    expect(report.duplicatePlanUsers).toEqual([]);
    expect(report.incompatiblePresetIndexes).toEqual([]);
    expect(report.presetsNeedingBackfill).toEqual([]);
    expect(await plans.countDocuments()).toBe(beforePlanCount);
    expect(await presets.countDocuments()).toBe(beforePresetCount);
  });

  test("reports exact duplicate IDs, global name indexes, and presets needing backfill", async () => {
    const plans = mongoose.connection.collection(DIET_PLANS_COLLECTION);
    const presets = mongoose.connection.collection(DIET_PLAN_PRESETS_COLLECTION);
    const planIds = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];
    const legacyPresetId = new mongoose.Types.ObjectId();
    const incompleteV2Id = new mongoose.Types.ObjectId();
    await plans.insertMany(
      planIds.map((_id) => ({ _id, userId: "duplicate-user", meals: [] }))
    );
    await presets.insertMany([
      {
        _id: legacyPresetId,
        name: "Legacy",
        trainerId: new mongoose.Types.ObjectId(),
        meals: [],
      },
      {
        _id: incompleteV2Id,
        name: "Incomplete V2",
        version: 2,
        trainerId: new mongoose.Types.ObjectId(),
        meals: [],
      },
    ]);
    await presets.createIndex({ name: 1 }, { unique: true, name: "legacy_global_name" });

    const report = await auditDietPlanV2Migration(mongoose.connection);

    expect(report.safeToMigrate).toBe(false);
    expect(report.duplicatePlanUsers).toEqual([
      {
        userId: "duplicate-user",
        count: 2,
        ids: planIds.map(String),
      },
    ]);
    expect(report.incompatiblePresetIndexes).toEqual([
      { name: "legacy_global_name", key: { name: 1 }, unique: true },
    ]);
    expect(report.presetsNeedingBackfill).toEqual([
      { id: legacyPresetId.toString(), name: "Legacy", missing: ["version", "normalizedName"] },
      { id: incompleteV2Id.toString(), name: "Incomplete V2", missing: ["normalizedName"] },
    ]);
  });
});
