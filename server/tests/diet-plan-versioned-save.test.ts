import mongoose from "mongoose";
import { APIGatewayProxyEvent } from "aws-lambda";
import { DietPlanController } from "../src/controllers/dietPlanController";
import { validateDietPlan } from "../src/middleware/dietPlanMiddleware";
import { DietPlan } from "../src/models/dietPlanModel";
import { DietPlanV2Model } from "../src/models/dietPlanV2Schemas";
import { DietV2CatalogItemModel } from "../src/models/dietV2CatalogItemModel";
import { User } from "../src/models/userModel";
import { DietPlanService } from "../src/services/dietPlanService";
import { runWithAuthContext } from "../src/utils/authContext";

const buildUser = async (trainerId: mongoose.Types.ObjectId) =>
  await User.create({
    firstName: "Test",
    lastName: "Trainee",
    email: `${new mongoose.Types.ObjectId()}@example.com`,
    phone: `+1${Math.floor(1_000_000_000 + Math.random() * 8_999_999_999)}`,
    trainerId,
    role: "user",
  });

const buildV1Plan = (userId: string) => ({
  userId,
  meals: [
    {
      totalProtein: { quantity: 2, customItems: [], extraItems: [] },
      totalCarbs: { quantity: 3, customItems: [], extraItems: [] },
      totalFats: { quantity: 1, customItems: [], extraItems: [] },
      totalVeggies: { quantity: 1, customItems: [], extraItems: [] },
    },
  ],
  supplements: [],
  customInstructions: ["Legacy instructions"],
  freeCalories: 100,
});

const buildV2Plan = (userId: string, catalogItemId?: string) => ({
  userId,
  version: 2 as const,
  meals: [
    {
      id: "meal-1",
      name: "Breakfast",
      categories: [
        {
          category: "protein" as const,
          items: [{ name: "100g Chicken breast", catalogItemId }],
        },
        { category: "carbs" as const, items: [{ name: "200g Rice" }] },
        { category: "fat" as const, items: [] },
        { category: "vegetables" as const, items: [] },
        { category: "addon" as const, items: [] },
      ],
      macros: { calories: 448, protein: 25, carbs: 45, fat: 12 },
      freeCalories: { calories: 150, description: "Fruit / snack / spread" },
      supplements: ["Creatine after training"],
    },
  ],
  highlights: "Drink water",
});

const withTrainer = <T>(trainerId: mongoose.Types.ObjectId, callback: () => Promise<T>) =>
  runWithAuthContext(
    {
      userId: trainerId.toString(),
      trainerId: trainerId.toString(),
      role: "trainer",
    },
    callback
  );

const buildEvent = (
  body: Record<string, unknown>,
  queryStringParameters: Record<string, string> | null = null
) =>
  ({
    body: JSON.stringify(body),
    queryStringParameters,
  }) as unknown as APIGatewayProxyEvent;

describe("version-aware diet-plan saves", () => {
  test("reads an unversioned legacy plan as version 1 without mutating storage", async () => {
    const trainerId = new mongoose.Types.ObjectId();
    const user = await buildUser(trainerId);
    await DietPlan.create(buildV1Plan(user._id.toString()));

    const result = await withTrainer(trainerId, () =>
      new DietPlanService().getDietPlanByUserId(user._id.toString(), false)
    );
    const stored = await DietPlan.collection.findOne({ userId: user._id.toString() });

    expect(result).toMatchObject({ version: 1, userId: user._id.toString() });
    expect(stored).not.toHaveProperty("version");
  });

  test("fully replaces V1 with V2 and V2 with V1 while keeping one active document", async () => {
    const trainerId = new mongoose.Types.ObjectId();
    const user = await buildUser(trainerId);
    const service = new DietPlanService();
    await DietPlan.create(buildV1Plan(user._id.toString()));

    await withTrainer(trainerId, () => service.saveActivePlan(buildV2Plan(user._id.toString())));

    let stored = await DietPlan.collection.findOne({ userId: user._id.toString() });
    expect(await DietPlan.collection.countDocuments({ userId: user._id.toString() })).toBe(1);
    expect(stored).toMatchObject({ version: 2, highlights: "Drink water" });
    expect(stored).not.toHaveProperty("customInstructions");
    expect(stored).not.toHaveProperty("totalCalories");

    await withTrainer(trainerId, () => service.saveActivePlan(buildV1Plan(user._id.toString())));

    stored = await DietPlan.collection.findOne({ userId: user._id.toString() });
    expect(await DietPlan.collection.countDocuments({ userId: user._id.toString() })).toBe(1);
    expect(stored).toMatchObject({ version: 1, customInstructions: ["Legacy instructions"] });
    expect(stored).not.toHaveProperty("highlights");
    expect(stored?.meals?.[0]).not.toHaveProperty("categories");
  });

  test("resolves catalog IDs from authenticated trainer names and catalogs free calories", async () => {
    const trainerId = new mongoose.Types.ObjectId();
    const otherTrainerId = new mongoose.Types.ObjectId();
    const user = await buildUser(trainerId);
    const foreignItem = await DietV2CatalogItemModel.create({
      trainerId: otherTrainerId,
      category: "protein",
      name: "100g Chicken breast",
      normalizedName: "100g chicken breast",
      usageCount: 99,
      lastUsedAt: new Date(),
    });

    const saved = await withTrainer(trainerId, () =>
      new DietPlanService().saveActivePlan(
        buildV2Plan(user._id.toString(), foreignItem._id.toString())
      )
    );
    const proteinItem = (saved as any).meals[0].categories[0].items[0];

    expect(proteinItem.catalogItemId.toString()).not.toBe(foreignItem._id.toString());
    await expect(
      DietV2CatalogItemModel.findOne({
        _id: proteinItem.catalogItemId,
        trainerId,
        category: "protein",
      })
    ).resolves.not.toBeNull();
    await expect(
      DietV2CatalogItemModel.findOne({
        trainerId,
        category: "freeCalories",
        normalizedName: "fruit / snack / spread",
      })
    ).resolves.toMatchObject({ usageCount: 1 });
  });

  test("does not invoke legacy population when reading a V2 plan", async () => {
    const trainerId = new mongoose.Types.ObjectId();
    const user = await buildUser(trainerId);
    await DietPlanV2Model.create({ ...buildV2Plan(user._id.toString()), trainerId });
    const service = new DietPlanService();
    const populationSpy = jest.spyOn((service as any).repository, "getPopulatedDietPlan");

    const result = await withTrainer(trainerId, () =>
      service.getDietPlanByUserId(user._id.toString(), true)
    );

    expect(result).toMatchObject({ version: 2 });
    expect(populationSpy).not.toHaveBeenCalled();
  });

  test("rejects saving a plan for another trainer's trainee", async () => {
    const trainerA = new mongoose.Types.ObjectId();
    const trainerB = new mongoose.Types.ObjectId();
    const user = await buildUser(trainerA);

    await expect(
      withTrainer(trainerB, () =>
        new DietPlanService().saveActivePlan(buildV2Plan(user._id.toString()))
      )
    ).rejects.toMatchObject({ status: 404 });

    expect(await DietPlan.collection.countDocuments({ userId: user._id.toString() })).toBe(0);
  });

  test("selects V2 validation and saves V2 through the existing controller route", async () => {
    const trainerId = new mongoose.Types.ObjectId();
    const user = await buildUser(trainerId);
    const request = buildV2Plan(user._id.toString());
    const event = buildEvent(request);

    expect(validateDietPlan(event).isValid).toBe(true);
    expect(
      validateDietPlan(
        buildEvent({
          ...request,
          meals: [{ ...request.meals[0], macros: { ...request.meals[0].macros, fat: -1 } }],
        })
      ).isValid
    ).toBe(false);

    const response = await withTrainer(trainerId, () =>
      new DietPlanController().addDietPlan(event)
    );

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body).data).toMatchObject({ version: 2, highlights: "Drink water" });
  });
});
