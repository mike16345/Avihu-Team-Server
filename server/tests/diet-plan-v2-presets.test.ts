import mongoose from "mongoose";
import { DietPlanPresetsModel } from "../src/models/dietPlanPresetModel";
import { DietPlanPresetV2Model } from "../src/models/dietPlanV2Schemas";
import { DietV2CatalogItemModel } from "../src/models/dietV2CatalogItemModel";
import { DietPlanPresetsService } from "../src/services/dietPlanPresetsService";
import { runWithAuthContext } from "../src/utils/authContext";

const buildV1Preset = (name: string) => ({
  name,
  meals: [
    {
      totalProtein: { quantity: 1 },
      totalCarbs: { quantity: 1 },
    },
  ],
  supplements: [],
});

const buildV2Preset = (name: string) => ({
  name,
  version: 2 as const,
  goal: "maintain" as const,
  targetGender: "both" as const,
  dietTags: ["kosher" as const],
  meals: [
    {
      id: "meal-1",
      name: "Breakfast",
      categories: [
        { category: "protein" as const, items: [{ name: "200g Greek yogurt" }] },
        { category: "carbs" as const, items: [{ name: "50g Oats" }] },
        { category: "fat" as const, items: [] },
        { category: "vegetables" as const, items: [] },
        { category: "addon" as const, items: [] },
      ],
      macros: { calories: 450, protein: 30, carbs: 50, fat: 12 },
      freeCalories: { calories: 100, description: "Fruit or snack" },
    },
  ],
  highlights: "Prepare breakfast the night before",
});

const withTeam = <T>(
  trainerId: mongoose.Types.ObjectId,
  actingUserId: mongoose.Types.ObjectId,
  role: "trainer" | "subTrainer",
  callback: () => Promise<T>
) =>
  runWithAuthContext(
    {
      userId: actingUserId.toString(),
      trainerId: trainerId.toString(),
      role,
    },
    callback
  );

describe("Diet Plan V2 presets", () => {
  test("creates a V2 preset in the parent trainer catalog and records the acting builder", async () => {
    const trainerId = new mongoose.Types.ObjectId();
    const subTrainerId = new mongoose.Types.ObjectId();
    const service = new DietPlanPresetsService();

    const saved = await withTeam(trainerId, subTrainerId, "subTrainer", () =>
      service.createPreset(buildV2Preset("Quick breakfast"))
    );
    const proteinItem = (saved as any).meals[0].categories[0].items[0];

    expect(saved).toMatchObject({
      version: 2,
      name: "Quick breakfast",
      normalizedName: "quick breakfast",
    });
    expect((saved as any).trainerId.toString()).toBe(trainerId.toString());
    expect((saved as any).builtByTrainerId.toString()).toBe(subTrainerId.toString());
    await expect(
      DietV2CatalogItemModel.findOne({
        _id: proteinItem.catalogItemId,
        trainerId,
        category: "protein",
      })
    ).resolves.not.toBeNull();
  });

  test("lists only the requested version and treats unversioned presets as V1", async () => {
    const trainerId = new mongoose.Types.ObjectId();
    const otherTrainerId = new mongoose.Types.ObjectId();
    const service = new DietPlanPresetsService();
    await DietPlanPresetsModel.collection.insertMany([
      { ...buildV1Preset("Legacy"), trainerId },
      { ...buildV1Preset("Other team"), trainerId: otherTrainerId },
    ]);
    await withTeam(trainerId, trainerId, "trainer", () =>
      service.createPreset(buildV2Preset("Modern"))
    );

    const v1 = await withTeam(trainerId, trainerId, "trainer", () => service.listPresets(1));
    const v2 = await withTeam(trainerId, trainerId, "trainer", () => service.listPresets(2));

    expect(v1.map((preset: any) => [preset.name, preset.version])).toEqual([["Legacy", 1]]);
    expect(v2.map((preset: any) => [preset.name, preset.version])).toEqual([["Modern", 2]]);
  });

  test("fully replaces a scoped preset and does not trust client ownership", async () => {
    const trainerId = new mongoose.Types.ObjectId();
    const actingUserId = new mongoose.Types.ObjectId();
    const service = new DietPlanPresetsService();
    const created = await withTeam(trainerId, actingUserId, "subTrainer", () =>
      service.createPreset(buildV2Preset("Editable"))
    );
    const malicious = {
      ...buildV2Preset("Renamed"),
      trainerId: new mongoose.Types.ObjectId(),
      builtByTrainerId: new mongoose.Types.ObjectId(),
    };

    const updated = await withTeam(trainerId, actingUserId, "subTrainer", () =>
      service.replacePresetById((created as any)._id.toString(), malicious as any)
    );

    expect(updated).toMatchObject({ version: 2, name: "Renamed", normalizedName: "renamed" });
    expect((updated as any).trainerId.toString()).toBe(trainerId.toString());
    expect((updated as any).builtByTrainerId.toString()).toBe(actingUserId.toString());
    expect(await DietPlanPresetV2Model.countDocuments({ _id: (created as any)._id })).toBe(1);
  });

  test("cannot read, update, or delete another trainer's preset by ID", async () => {
    const trainerA = new mongoose.Types.ObjectId();
    const trainerB = new mongoose.Types.ObjectId();
    const service = new DietPlanPresetsService();
    const created = await withTeam(trainerA, trainerA, "trainer", () =>
      service.createPreset(buildV2Preset("Private"))
    );
    const id = (created as any)._id.toString();

    await expect(
      withTeam(trainerB, trainerB, "trainer", () => service.getPresetById(id))
    ).resolves.toBeNull();
    await expect(
      withTeam(trainerB, trainerB, "trainer", () =>
        service.replacePresetById(id, buildV2Preset("Stolen"))
      )
    ).resolves.toBeNull();
    await expect(
      withTeam(trainerB, trainerB, "trainer", () => service.deletePresetById(id))
    ).resolves.toBeNull();

    await expect(DietPlanPresetV2Model.findById(id)).resolves.not.toBeNull();
  });

  test("supports explicit version 1 validation for normalized API responses", () => {
    const { DietPlanPresetSchemaValidation } = require("../src/models/dietPlanPresetModel");

    expect(
      DietPlanPresetSchemaValidation.validate({ ...buildV1Preset("Legacy"), version: 1 }).error
    ).toBeUndefined();
  });
});
