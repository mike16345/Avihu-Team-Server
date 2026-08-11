import mongoose from "mongoose";
import { APIGatewayProxyEvent } from "aws-lambda";
import { DietV2CatalogController } from "../src/controllers/dietV2CatalogController";
import {
  validateDietV2CatalogDelete,
  validateDietV2CatalogSearch,
} from "../src/middleware/dietV2CatalogMiddleware";
import { DietV2CatalogItemModel } from "../src/models/dietV2CatalogItemModel";
import { DietV2CatalogService } from "../src/services/dietV2CatalogService";
import { runWithAuthContext } from "../src/utils/authContext";

const withTrainer = <T>(trainerId: string, callback: () => Promise<T>) =>
  runWithAuthContext({ userId: trainerId, trainerId, role: "trainer" }, callback);

describe("Diet V2 trainer catalog", () => {
  test("deduplicates normalized names per trainer/category and increments approximate usage", async () => {
    const trainerId = new mongoose.Types.ObjectId().toString();
    const service = new DietV2CatalogService();

    await withTrainer(trainerId, () =>
      service.resolveAndTouch([
        { category: "protein", name: "100g Chicken breast" },
        { category: "protein", name: "  100G   chicken BREAST " },
      ])
    );
    await withTrainer(trainerId, () =>
      service.resolveAndTouch([{ category: "protein", name: "100g chicken breast" }])
    );

    const items = await DietV2CatalogItemModel.find({ trainerId }).lean();

    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("100g Chicken breast");
    expect(items[0].normalizedName).toBe("100g chicken breast");
    expect(items[0].usageCount).toBe(2);
  });

  test("allows the same normalized name for another category and another trainer", async () => {
    const trainerA = new mongoose.Types.ObjectId().toString();
    const trainerB = new mongoose.Types.ObjectId().toString();
    const service = new DietV2CatalogService();

    await withTrainer(trainerA, () =>
      service.resolveAndTouch([
        { category: "protein", name: "Rice" },
        { category: "carbs", name: "rice" },
      ])
    );
    await withTrainer(trainerB, () =>
      service.resolveAndTouch([{ category: "protein", name: "RICE" }])
    );

    expect(await DietV2CatalogItemModel.countDocuments({})).toBe(3);
  });

  test("searches substrings only inside the authenticated trainer and category", async () => {
    const trainerA = new mongoose.Types.ObjectId().toString();
    const trainerB = new mongoose.Types.ObjectId().toString();
    const service = new DietV2CatalogService();

    await withTrainer(trainerA, () =>
      service.resolveAndTouch([
        { category: "protein", name: "100 grams Chicken breast" },
        { category: "carbs", name: "Chicken flavored rice" },
      ])
    );
    await withTrainer(trainerB, () =>
      service.resolveAndTouch([{ category: "protein", name: "Other chicken" }])
    );

    const results = await withTrainer(trainerA, () => service.search("protein", "chicken"));

    expect(results.map((item) => item.name)).toEqual(["100 grams Chicken breast"]);
    expect(results).toHaveLength(1);
  });

  test("returns bounded popular items ordered by usage and recency", async () => {
    const trainerId = new mongoose.Types.ObjectId().toString();
    const service = new DietV2CatalogService();

    await withTrainer(trainerId, () =>
      service.resolveAndTouch([
        { category: "protein", name: "Chicken" },
        { category: "protein", name: "Tuna" },
      ])
    );
    await withTrainer(trainerId, () =>
      service.resolveAndTouch([{ category: "protein", name: "Tuna" }])
    );

    const popular = await withTrainer(trainerId, () => service.getPopular(1));

    expect(popular.protein).toHaveLength(1);
    expect(popular.protein[0].name).toBe("Tuna");
    expect(popular.carbs).toEqual([]);
  });

  test("shares the parent catalog with subtrainers and scopes deletion by trainer", async () => {
    const parentTrainerId = new mongoose.Types.ObjectId().toString();
    const otherTrainerId = new mongoose.Types.ObjectId().toString();
    const subTrainerId = new mongoose.Types.ObjectId().toString();
    const service = new DietV2CatalogService();

    const resolved = await runWithAuthContext(
      { userId: subTrainerId, trainerId: parentTrainerId, role: "subTrainer" },
      () => service.resolveAndTouch([{ category: "protein", name: "Shared chicken" }])
    );
    const itemId = resolved.get("protein:shared chicken")?._id?.toString();

    expect(itemId).toBeDefined();
    await expect(withTrainer(otherTrainerId, () => service.deleteItem(itemId!))).resolves.toBeNull();
    await expect(withTrainer(parentTrainerId, () => service.deleteItem(itemId!))).resolves.toMatchObject({
      name: "Shared chicken",
    });
  });
});

describe("Diet V2 catalog HTTP boundary", () => {
  const eventWithQuery = (query: Record<string, string>): APIGatewayProxyEvent =>
    ({ queryStringParameters: query } as unknown as APIGatewayProxyEvent);

  test("rejects invalid search categories, blank queries, and invalid delete IDs", () => {
    expect(
      validateDietV2CatalogSearch(eventWithQuery({ category: "dessert", q: "chicken" }))
        .isValid
    ).toBe(false);
    expect(
      validateDietV2CatalogSearch(eventWithQuery({ category: "protein", q: "  " })).isValid
    ).toBe(false);
    expect(validateDietV2CatalogDelete(eventWithQuery({ id: "not-an-object-id" })).isValid).toBe(
      false
    );
  });

  test("returns authenticated category matches through the controller", async () => {
    const trainerId = new mongoose.Types.ObjectId().toString();
    const service = new DietV2CatalogService();
    const controller = new DietV2CatalogController();

    await withTrainer(trainerId, () =>
      service.resolveAndTouch([{ category: "protein", name: "200g Greek yogurt" }])
    );

    const response = await withTrainer(trainerId, () =>
      controller.search(eventWithQuery({ category: "protein", q: "yogurt" }))
    );
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("200g Greek yogurt");
  });
});
