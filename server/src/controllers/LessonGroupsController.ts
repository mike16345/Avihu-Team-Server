import { LessonGroupService } from "../services/LessonGroupService";
import BaseController from "./BaseController";
import { ILessonGroup } from "../models/lessonGroupsModel";

export class LessonGroupsController extends BaseController<ILessonGroup, LessonGroupService> {
  constructor() {
    super(new LessonGroupService());
  }
}
