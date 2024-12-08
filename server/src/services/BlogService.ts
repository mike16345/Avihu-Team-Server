import { BlogModel } from "../models/blogsModel";

export class BlogService {
  static async getAllPosts() {
    try {
      const allPosts = await BlogModel.find();

      return allPosts;
    } catch (error) {
      throw error;
    }
  }

  static async getPostById(id: string) {
    try {
      const post = await BlogModel.findById(id);
      return post;
    } catch (error) {
      throw error;
    }
  }
  static async createPost(newPost: any) {
    try {
      const createdPost = await BlogModel.create(newPost);

      return createdPost;
    } catch (error) {
      throw error;
    }
  }

  static async updatePost(id: string, post: any) {
    try {
      const updatedPost = await BlogModel.findByIdAndUpdate(id, post, {
        new: true,
      });

      return updatedPost;
    } catch (error) {
      throw error;
    }
  }
  static async deletePost(id: string) {
    try {
      const deletedPost = await BlogModel.findByIdAndDelete(id);

      return deletedPost;
    } catch (error) {
      throw error;
    }
  }
}
