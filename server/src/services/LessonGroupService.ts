import mongoose from "mongoose";
import { LessonGroup } from "../models/lessonGroupsModel";

export class LessonGroupService {
  static async addLessonGroup(lessonGroup: string) {
    try {
      return await LessonGroup.create({ name: lessonGroup });
    } catch (e) {
      throw e;
    }
  }

  static async updateLessonGroup(id: string, lessonGroup: string) {
    try {
      return await LessonGroup.updateOne(
        { _id: new mongoose.mongo.ObjectId(id) },
        { name: lessonGroup }
      );
    } catch (e) {
      throw e;
    }
  }

  static async deleteLessonGroup(id: string) {
    try {
      return await LessonGroup.deleteOne({ _id: new mongoose.mongo.ObjectId(id) });
    } catch (e) {
      throw e;
    }
  }

  static async getLessonGroups() {
    try {
      return await LessonGroup.find({});
    } catch (e) {
      throw e;
    }
  }

  static async getLessonGroupById(id: string) {
    try {
      return await LessonGroup.findById(id);
    } catch (e) {
      throw e;
    }
  }
}
