import { ILessonGroup, LessonGroup } from "../../models/lessonGroupsModel";
import { BaseRepository } from "../BaseRepository";

export class LessonGroupRepository extends BaseRepository<ILessonGroup> {
  constructor() {
    super(LessonGroup);
  }
}
