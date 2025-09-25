import { IBlog } from "../../interfaces/IBlog";
import { BlogModel } from "../../models/blogsModel";
import { BaseRepository } from "../BaseRepository";

export class BlogRepository extends BaseRepository<IBlog> {
  constructor() {
    super(BlogModel);
  }

  addViewer = async (id: string, userId: string) => {
    const blog = await this.model.findByIdAndUpdate(
      id,
      { $addToSet: { views: userId } },
      { new: true }
    );

    return blog;
  };

  changeLikedStatus = async (id: string, userId: string) => {
    const blog = await this.model.findById(id);

    if (!blog) {
      throw new Error("Blog not found");
    }

    const hasLiked = blog.likes.includes(userId);

    const updatedBlog = await this.model.findByIdAndUpdate(
      id,
      hasLiked
        ? { $pull: { likes: userId } } // remove if exists
        : { $addToSet: { likes: userId } }, // add if not
      { new: true }
    );

    return updatedBlog;
  };

  getBlogCountsByGroup = async () => {
    const counts = await this.model.aggregate([
      {
        $group: {
          _id: "$group", // group by lessonGroup ObjectId
          count: { $sum: 1 }, // count blogs in each group
        },
      },
      {
        $lookup: {
          from: "lessongroups", // name of the lessonGroups collection
          localField: "_id", // the ObjectId stored in blogs.group
          foreignField: "_id", // match it against lessonGroups._id
          as: "lessonGroup",
        },
      },
      { $unwind: "$lessonGroup" }, // flatten the lessonGroup array
      {
        $project: {
          _id: 0,
          name: "$lessonGroup.name", // pull just the name
          count: 1,
        },
      },
    ]);

    return counts;
  };
}
