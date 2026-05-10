import { BaseRepository } from "../src/repositories/BaseRepository";
import { runWithAuthContext } from "../src/utils/authContext";
import { StatusCode } from "../src/enums/StatusCode";

const createModelDouble = (hasTrainerId: boolean) => {
  const model: any = {
    modelName: hasTrainerId ? "trainerOwnedModel" : "globalModel",
    schema: {
      path: jest.fn((field: string) => {
        if (field === "trainerId") {
          return hasTrainerId ? {} : undefined;
        }

        return undefined;
      }),
    },
    create: jest.fn(async (doc: any) => doc),
    exists: jest.fn(async () => ({ _id: "doc-1" })),
    find: jest.fn(async () => [{ _id: "doc-1" }]),
    findOne: jest.fn(async (query: any) => ({ _id: "doc-1", ...query })),
    findOneAndUpdate: jest.fn(async (query: any, update: any) => ({ _id: "doc-1", query, update })),
    findOneAndDelete: jest.fn(() => ({
      lean: () => ({
        exec: async () => ({ _id: "doc-1" }),
      }),
    })),
    deleteMany: jest.fn(async () => ({ deletedCount: 1 })),
    updateMany: jest.fn(async () => ({ modifiedCount: 1 })),
    countDocuments: jest.fn(() => ({
      exec: async () => 1,
    })),
  };

  return model;
};

describe("BaseRepository trainer scoping", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test("trainer-scoped create ignores client trainerId and uses auth context", async () => {
    const model = createModelDouble(true);
    const repository = new BaseRepository<any>(model, {
      type: "trainer",
      field: "trainerId",
    });

    await runWithAuthContext({ trainerId: "trainer-from-token" }, async () => {
      await repository.create({ title: "doc", trainerId: "trainer-from-client" });
    });

    expect(model.create).toHaveBeenCalledWith({
      title: "doc",
      trainerId: "trainer-from-token",
    });
  });

  test("trainer-scoped reads merge trainerId into the Mongo filter", async () => {
    const model = createModelDouble(true);
    const repository = new BaseRepository<any>(model, {
      type: "trainer",
      field: "trainerId",
    });

    await runWithAuthContext({ trainerId: "trainer-123" }, async () => {
      await repository.findOne({ query: { slug: "hello-world" } });
    });

    expect(model.findOne).toHaveBeenCalledWith(
      { slug: "hello-world", trainerId: "trainer-123" },
      undefined,
      undefined
    );
  });

  test("trainer-scoped updates cannot override trainerId", async () => {
    const model = createModelDouble(true);
    const repository = new BaseRepository<any>(model, {
      type: "trainer",
      field: "trainerId",
    });

    await runWithAuthContext({ trainerId: "trainer-123" }, async () => {
      await repository.updateOne({
        filter: { slug: "doc-1", trainerId: "other-trainer" },
        update: {
          trainerId: "client-trainer",
          $set: { trainerId: "client-trainer", title: "updated" },
        },
        options: { new: true },
      });
    });

    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { slug: "doc-1", trainerId: "trainer-123" },
      {
        $set: { title: "updated" },
        $setOnInsert: { trainerId: "trainer-123" },
      },
      { new: true }
    );
  });

  test("trainer-scoped repositories reject requests without trainer context", async () => {
    const model = createModelDouble(true);
    const repository = new BaseRepository<any>(model, {
      type: "trainer",
      field: "trainerId",
    });

    await expect(
      runWithAuthContext({ userId: "u1" }, async () => {
        await repository.find({ query: {} });
      })
    ).rejects.toMatchObject({
      statusCode: StatusCode.UNAUTHORIZED,
    });
  });

  test("global repositories do not inject trainerId into queries or creates", async () => {
    const model = createModelDouble(false);
    const repository = new BaseRepository<any>(model, { type: "global" });

    await runWithAuthContext({ trainerId: "trainer-123" }, async () => {
      await repository.create({ title: "global-doc" });
      await repository.findOne({ query: { slug: "global-doc" } });
    });

    expect(model.create).toHaveBeenCalledWith({ title: "global-doc" });
    expect(model.findOne).toHaveBeenCalledWith({ slug: "global-doc" }, undefined, undefined);
  });
});
