import mongoose from "mongoose";
import {
  WeighIns,
  WeighInSchemaValidation,
  WeighInsSchemaValidation,
} from "../../src/models/weighInModel";
import {
  ValidWeighIn,
  InvalidWeighIn,
  ValidWeighIns,
  InvalidWeighIns,
} from "../fixtures/weighInsFixtures";

const { model } = mongoose;

describe("Mongoose Schemas", () => {
  const WeighInModel = model("WeighIn", WeighIns.schema.path("weighIns").schema);
  const WeighInsModel = model("WeighIns", WeighIns.schema);

  test("should validate a valid weigh-in", async () => {
    const validWeighIn = new WeighInModel(ValidWeighIn);
    const savedWeighIn = await validWeighIn.save();

    expect(savedWeighIn.weight).toBe(ValidWeighIn.weight);
  });

  test("should throw validation error for invalid weigh-in", async () => {
    const invalidWeighIn = new WeighInModel(InvalidWeighIn);

    await expect(invalidWeighIn.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test("should validate a valid weigh-ins collection", async () => {
    const validWeighIns = new WeighInsModel(ValidWeighIns);
    const savedWeighIns = await validWeighIns.save();

    expect(savedWeighIns.userId).toBe(ValidWeighIns.userId);
    expect(savedWeighIns.weighIns.length).toBe(ValidWeighIns.weighIns.length);
    expect(savedWeighIns.weighIns[0].weight).toBe(ValidWeighIns.weighIns[0].weight);
  });

  test("should throw validation error for invalid weigh-ins collection", async () => {
    const invalidWeighIns = new WeighInsModel(InvalidWeighIns);

    await expect(invalidWeighIns.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });
});

describe("Joi Validation", () => {
  test("should validate a valid weigh-in", () => {
    const { error } = WeighInSchemaValidation.validate(ValidWeighIn);

    expect(error).toBeUndefined();
  });

  test("should return validation error for invalid weigh-in", () => {
    const { error } = WeighInSchemaValidation.validate(InvalidWeighIn);

    expect(error).not.toBeUndefined();
  });

  test("should validate a valid weigh-ins collection", () => {
    const { error } = WeighInsSchemaValidation.validate(ValidWeighIns);

    expect(error).toBeUndefined();
  });

  test("should return validation error for invalid weigh-ins collection", () => {
    const { error } = WeighInsSchemaValidation.validate(InvalidWeighIns);

    expect(error).not.toBeUndefined();
  });

  test("should return validation error for missing required fields", () => {
    const invalidWeighIns = {
      weighIns: [
        {
          weight: 150,
        },
      ],
    };
    const { error } = WeighInsSchemaValidation.validate(invalidWeighIns);

    expect(error).not.toBeUndefined();
  });

  test("should return validation error for empty weighIns array", () => {
    const invalidWeighIns = {
      userId: "someUserId",
      weighIns: [],
    };
    const { value, error } = WeighInsSchemaValidation.validate(invalidWeighIns);
    console.log("vaLUE", value);
    expect(error).not.toBeUndefined();
  });
});
