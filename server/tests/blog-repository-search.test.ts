import mongoose from "mongoose";
import { BlogModel } from "../src/models/blogsModel";
import { LessonGroup } from "../src/models/lessonGroupsModel";
import { BlogRepository } from "../src/repositories/Blogs/BlogRepository";
import { runWithAuthContext } from "../src/utils/authContext";

describe("BlogRepository search", () => {
  afterEach(async () => {
    await BlogModel.deleteMany({});
    await LessonGroup.deleteMany({});
  });

  test("matches article group names in paginated search results", async () => {
    const trainerId = new mongoose.Types.ObjectId();
    const group = await LessonGroup.create({
      name: "Mobility",
      description: "Movement articles",
      trainerId,
    });

    await BlogModel.create({
      title: "Shoulder warmup",
      subtitle: "Five minute routine",
      content: "Prepare before training",
      group: group._id,
      trainerId,
    });

    const repository = new BlogRepository();
    const result = await runWithAuthContext({ trainerId: trainerId.toString() }, () =>
      repository.getPaginatedBlogs({
        page: 1,
        limit: 10,
        query: { search: "Mobility" },
      })
    );

    expect(result.totalResults).toBe(1);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].title).toBe("Shoulder warmup");
  });
});
