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
import { DietV2CatalogService } from "../src/services/dietV2CatalogService";

const buildUser = async (trainerId: mongoose.Types.ObjectId) =>
  await User.create({
    firstName: "Test",
    lastName: "Trainee",
    email: `${new mongoose.Types.ObjectId()}@example.com`,
    phone: `+1${Math.floor(1_000_000_000 + Math.random() * 8_999_999_999)}`,
    profileImage: `test-${new mongoose.Types.ObjectId()}.png`,
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
      name: "Breakfast",
      categories: [
        {
          category: "protein" as const,
          items: [{ name: "100g Chicken breast", catalogItemId }],
          macros: { calories: 200, protein: 25 },
        },
        {
          category: "carbs" as const,
          items: [{ name: "200g Rice" }],
          macros: { calories: 248, carbs: 45 },
        },
        { category: "fat" as const, items: [] },
        { category: "vegetables" as const, items: [] },
      ],
      addOns: [{ name: "Morning coffee" }],
      macros: { calories: 448, protein: 25, carbs: 45, fat: 12 },
      freeCalories: { calories: 150, items: [{ name: "Fruit" }, { name: "Snack" }] },
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

const withAdmin = <T>(trainerId: mongoose.Types.ObjectId, callback: () => Promise<T>) =>
  runWithAuthContext(
    {
      userId: trainerId.toString(),
      trainerId: trainerId.toString(),
      role: "admin",
    },
    callback
  );

const buildEvent = (
  body: Record<string, unknown>,
  queryStringParameters: Record<string, string> | null = null,
  httpMethod: "POST" | "PUT" = "POST"
) =>
  ({
    body: JSON.stringify(body),
    queryStringParameters,
    httpMethod,
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

  test("normalizes older V2 highlights and free-calorie descriptions only in the response", async () => {
    const trainerId = new mongoose.Types.ObjectId();
    const user = await buildUser(trainerId);
    await DietPlan.collection.insertOne({
      userId: user._id.toString(),
      trainerId,
      version: 2,
      highlights: ["Drink water", "<unsafe>"],
      meals: [
        {
          name: "Breakfast",
          categories: [],
          addOns: [],
          macros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          freeCalories: { calories: 100, description: "Fruit or snack" },
        },
      ],
    });

    const result = await withTrainer(trainerId, () =>
      new DietPlanService().getDietPlanByUserId(user._id.toString(), false)
    );
    const stored = await DietPlan.collection.findOne({ userId: user._id.toString() });

    expect(result?.highlights).toBe("<p>Drink water</p><p>&lt;unsafe&gt;</p>");
    expect((result as any)?.meals[0].freeCalories).toEqual({
      calories: 100,
      items: [{ name: "Fruit or snack" }],
    });
    expect(stored?.highlights).toEqual(["Drink water", "<unsafe>"]);
    expect((stored as any)?.meals[0].freeCalories.description).toBe("Fruit or snack");
  });

  test("allows only an Admin to replace a plan with a different version", async () => {
    const trainerId = new mongoose.Types.ObjectId();
    const user = await buildUser(trainerId);
    const service = new DietPlanService();
    await DietPlan.create(buildV1Plan(user._id.toString()));

    await expect(
      withTrainer(trainerId, () => service.saveActivePlan(buildV2Plan(user._id.toString())))
    ).rejects.toMatchObject({ status: 403 });

    await withAdmin(trainerId, () => service.saveActivePlan(buildV2Plan(user._id.toString())));

    let stored = await DietPlan.collection.findOne({ userId: user._id.toString() });
    expect(await DietPlan.collection.countDocuments({ userId: user._id.toString() })).toBe(1);
    expect(stored).toMatchObject({ version: 2, highlights: "Drink water" });
    expect(stored).not.toHaveProperty("customInstructions");
    expect(stored).not.toHaveProperty("totalCalories");

    await withAdmin(trainerId, () => service.saveActivePlan(buildV1Plan(user._id.toString())));

    stored = await DietPlan.collection.findOne({ userId: user._id.toString() });
    expect(await DietPlan.collection.countDocuments({ userId: user._id.toString() })).toBe(1);
    expect(stored).toMatchObject({ version: 1, customInstructions: ["Legacy instructions"] });
    expect(stored).not.toHaveProperty("highlights");
    expect(stored?.meals?.[0]).not.toHaveProperty("categories");
  });

  test("preserves a saved meal _id when replacing a V2 plan", async () => {
    const trainerId = new mongoose.Types.ObjectId();
    const user = await buildUser(trainerId);
    const service = new DietPlanService();
    const created = await withTrainer(trainerId, () =>
      service.saveActivePlan(buildV2Plan(user._id.toString()))
    );
    const mealId = (created as any).meals[0]._id;

    expect(mealId).toBeDefined();

    const updated = await withTrainer(trainerId, () =>
      service.saveActivePlan({
        ...(created as any),
        meals: [
          {
            ...(created as any).meals[0],
            categories: (created as any).meals[0].categories.map((category: any) =>
              category.category === "protein"
                ? { ...category, macros: { ...category.macros, calories: 252 } }
                : category
            ),
            macros: { calories: 9999, protein: 9999, carbs: 9999, fat: 9999 },
          },
        ],
      })
    );

    expect((updated as any).meals[0]._id.toString()).toBe(mealId.toString());
    expect((updated as any).meals[0].macros).toMatchObject({
      calories: 500,
      protein: 25,
      carbs: 45,
      fat: 0,
    });
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
        category: "addon",
        normalizedName: "morning coffee",
      })
    ).resolves.toMatchObject({ usageCount: 1 });
    await expect(
      DietV2CatalogItemModel.findOne({
        trainerId,
        category: "freeCalories",
        normalizedName: "fruit",
      })
    ).resolves.toMatchObject({ usageCount: 1 });
    await expect(
      DietV2CatalogItemModel.findOne({
        trainerId,
        category: "freeCalories",
        normalizedName: "snack",
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

  test("lists only plans belonging to the authenticated trainer team", async () => {
    const trainerA = new mongoose.Types.ObjectId();
    const trainerB = new mongoose.Types.ObjectId();
    const userA = await buildUser(trainerA);
    const userB = await buildUser(trainerB);
    await DietPlan.create(buildV1Plan(userA._id.toString()));
    await DietPlanV2Model.create({ ...buildV2Plan(userB._id.toString()), trainerId: trainerB });

    const results = await withTrainer(trainerA, () => new DietPlanService().listTeamPlans());

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ userId: userA._id.toString(), version: 1 });
  });

  test("keeps saved name snapshots after a catalog suggestion is deleted", async () => {
    const trainerId = new mongoose.Types.ObjectId();
    const user = await buildUser(trainerId);
    const saved = await withTrainer(trainerId, () =>
      new DietPlanService().saveActivePlan(buildV2Plan(user._id.toString()))
    );
    const item = (saved as any).meals[0].categories[0].items[0];

    await withTrainer(trainerId, () =>
      new DietV2CatalogService().deleteItem(item.catalogItemId.toString())
    );
    const stored = await DietPlan.collection.findOne({ userId: user._id.toString() });

    expect(stored?.meals[0].categories[0].items[0]).toMatchObject({
      name: "100g Chicken breast",
      catalogItemId: item.catalogItemId,
    });
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

  test("requires body userId on create but derives it for updates", () => {
    const request = buildV2Plan(new mongoose.Types.ObjectId().toString());
    const { userId: _userId, ...bodyWithoutUserId } = request;

    expect(validateDietPlan(buildEvent(bodyWithoutUserId, null, "POST")).isValid).toBe(false);
    expect(validateDietPlan(buildEvent(bodyWithoutUserId, null, "PUT")).isValid).toBe(true);
  });
});
