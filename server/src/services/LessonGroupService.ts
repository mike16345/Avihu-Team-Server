import { ILessonGroup } from "../models/lessonGroupsModel";
import { BaseService } from "./BaseService";
import { LessonGroupRepository } from "../repositories/LessonGroups/LessonGroupRepository";

const baseKey = "lesson-groups";

export class LessonGroupService extends BaseService<ILessonGroup, LessonGroupRepository> {
  constructor() {
    super(new LessonGroupRepository(), baseKey);
  }
}
