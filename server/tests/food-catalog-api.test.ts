import { Types } from "mongoose";
import {
  validateFoodCatalogItemId,
  validateFoodCatalogLookup,
  validateFoodCatalogOverride,
} from "../src/middleware/foodCatalogMiddleware";
import { FoodCatalogController } from "../src/controllers/FoodCatalogController";
import { foodCatalogApiRoutes } from "../src/functions/foodCatalog";

const event = (query: Record<string, string> = {}, body?: unknown): any => ({
  queryStringParameters: query,
  body: body === undefined ? null : JSON.stringify(body),
  authUser: { _id: new Types.ObjectId("64b000000000000000000001") },
});

describe("food catalog request validation", () => {
  test("accepts supported barcode lengths and rejects non-digit barcode input", () => {
    expect(validateFoodCatalogLookup(event({ barcode: "012345678905" })).isValid).toBe(true);
    expect(validateFoodCatalogLookup(event({ barcode: "123-456" })).isValid).toBe(false);
  });

  test("requires valid item ids", () => {
    expect(validateFoodCatalogItemId(event({ id: "64b000000000000000000001" })).isValid).toBe(true);
    expect(validateFoodCatalogItemId(event({ id: "bad" })).isValid).toBe(false);
  });

  test("allows finite nonnegative override values and null for clearing", () => {
    expect(
      validateFoodCatalogOverride(
        event(
          { id: "64b000000000000000000001" },
          { overrides: { nutrition: { per100: { calories: 0, protein: null } } } }
        )
      ).isValid
    ).toBe(true);
    expect(
      validateFoodCatalogOverride(
        event(
          { id: "64b000000000000000000001" },
          { overrides: { nutrition: { per100: { calories: -1 } } } }
        )
      ).isValid
    ).toBe(false);
  });
});

describe("food catalog API", () => {
  test("declares ordinary catalog routes as authenticated and overrides as admin-only", () => {
    expect(foodCatalogApiRoutes["GET /foodCatalog/barcode"].access).toBe("authenticated");
    expect(foodCatalogApiRoutes["POST /foodCatalog/consumption"].access).toBe("authenticated");
    expect(foodCatalogApiRoutes["PATCH /foodCatalog/admin-overrides"].access).toBe("admin");
    expect(foodCatalogApiRoutes["DELETE /foodCatalog/admin-overrides"].access).toBe("admin");
  });

  test("returns the stable service payload for a barcode lookup", async () => {
    const service: any = {
      lookupBarcode: jest.fn().mockResolvedValue({
        product: { id: "item", displayName: "מוצר" },
        cache: { status: "hit" },
      }),
    };
    const controller = new FoodCatalogController(service);

    const response = await controller.lookupBarcode(event({ barcode: "12345678" }));

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).data).toEqual({
      product: { id: "item", displayName: "מוצר" },
      cache: { status: "hit" },
    });
  });
});
