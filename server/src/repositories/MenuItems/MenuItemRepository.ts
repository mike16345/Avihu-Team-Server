import { ICustomItemInstructions } from "../../interfaces/IDietPlan";
import { fullMenuItemPresets } from "../../models/menuItemModel";
import { BaseRepository } from "../BaseRepository";

export class MenuItemRepository extends BaseRepository<ICustomItemInstructions> {
  constructor() {
    super(fullMenuItemPresets, { type: "trainer", field: "trainerId" });
  }
}
