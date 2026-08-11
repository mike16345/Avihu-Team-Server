import mongoose from "mongoose";
import { DietPlan } from "../../src/models/dietPlanModel";
import { DietPlanPresetsModel } from "../../src/models/dietPlanPresetModel";
import {
  DietPlanPresetV2Model,
  DietPlanPresetV2SchemaValidation,
  DietPlanV2Model,
  DietPlanV2SchemaValidation,
} from "../../src/models/dietPlanV2Schemas";

const buildCategories = () => [
  { category: "protein", items: [{ name: "100g Chicken breast" }] },
  { category: "carbs", items: [{ name: "200 grams rice" }] },
  { category: "fat", items: [] },
  { category: "vegetables", items: [] },
  { category: "addon", items: [] },
];

const buildPlan = (overrides: Record<string, unknown> = {}) => ({
  userId: new mongoose.Types.ObjectId().toString(),
  version: 2,
  meals: [
    {
      id: "meal-1",
      name: "Breakfast",
      categories: buildCategories(),
      macros: {
        calories: 448,
        protein: 25,
        carbs: 45,
        fat: 12,
      },
      freeCalories: {
        calories: 150,
        description: "Fruit / snack / spread",
      },
      supplements: ["Creatine after training"],
    },
  ],
  highlights: "Drink water",
  ...overrides,
});

describe("Diet Plan V2 validation", () => {
  test("accepts the complete literal-name plan contract", () => {
    const result = DietPlanV2SchemaValidation.validate(buildPlan());

    expect(result.error).toBeUndefined();
    expect(result.value.meals[0].categories[0].items[0].name).toBe(
      "100g Chicken breast"
    );
  });

  test("rejects normalized duplicate names inside one category", () => {
    const categories = buildCategories();
    categories[0].items.push({ name: "  100G   chicken BREAST " });
    const result = DietPlanV2SchemaValidation.validate(
      buildPlan({ meals: [{ ...buildPlan().meals[0], categories }] })
    );

    expect(result.error?.message).toContain("duplicate");
  });

  test("allows the same normalized name in different categories", () => {
    const categories = buildCategories();
    categories[1].items = [{ name: " 100G   chicken BREAST " }];
    const result = DietPlanV2SchemaValidation.validate(
      buildPlan({ meals: [{ ...buildPlan().meals[0], categories }] })
    );

    expect(result.error).toBeUndefined();
  });

  test("rejects repeated categories, incomplete free calories, and invalid macros", () => {
    const baseMeal = buildPlan().meals[0];
    const repeatedCategory = DietPlanV2SchemaValidation.validate(
      buildPlan({
        meals: [
          {
            ...baseMeal,
            categories: [baseMeal.categories[0], baseMeal.categories[0]],
          },
        ],
      })
    );
    const incompleteFreeCalories = DietPlanV2SchemaValidation.validate(
      buildPlan({ meals: [{ ...baseMeal, freeCalories: { calories: 100 } }] })
    );
    const invalidMacros = DietPlanV2SchemaValidation.validate(
      buildPlan({ meals: [{ ...baseMeal, macros: { ...baseMeal.macros, protein: -1 } }] })
    );

    expect(repeatedCategory.error?.message).toContain("duplicate category");
    expect(incompleteFreeCalories.error).toBeDefined();
    expect(invalidMacros.error).toBeDefined();
  });
});

describe("Diet Plan V2 shared collections", () => {
  test("stores strict V1 and V2 documents in the same diet-plan collection", async () => {
    const trainerId = new mongoose.Types.ObjectId();
    const v1 = await DietPlan.create({
      userId: new mongoose.Types.ObjectId().toString(),
      meals: [
        {
          totalProtein: { quantity: 1 },
          totalCarbs: { quantity: 1 },
        },
      ],
      supplements: [],
    });
    const request = buildPlan();
    const v2 = await DietPlanV2Model.create({ ...request, trainerId });

    expect(DietPlan.collection.name).toBe(DietPlanV2Model.collection.name);
    expect(v1.get("version")).toBeUndefined();
    expect(v2.version).toBe(2);
    expect(v2.meals[0].categories[0].items[0]).not.toHaveProperty("_id");
  });

  test("stores V1 and V2 presets in the same preset collection", async () => {
    const trainerId = new mongoose.Types.ObjectId();
    const request = buildPlan();
    delete (request as Record<string, unknown>).userId;
    const validation = DietPlanPresetV2SchemaValidation.validate({
      ...request,
      name: "Quick V2 Plan",
      goal: "maintain",
      targetGender: "both",
      dietTags: ["kosher"],
    });

    expect(validation.error).toBeUndefined();

    const preset = await DietPlanPresetV2Model.create({
      ...validation.value,
      normalizedName: "quick v2 plan",
      trainerId,
      builtByTrainerId: trainerId,
    });

    expect(DietPlanPresetsModel.collection.name).toBe(
      DietPlanPresetV2Model.collection.name
    );
    expect(preset.version).toBe(2);
  });
});
