import { ICustomItemInstructions } from "../interfaces/IDietPlan";
import { MenuItemRepository } from "../repositories/MenuItems/MenuItemRepository";
import { BaseService } from "./baseService";

const RESOURCE_NAME = "menu-item";

export class MenuItemService extends BaseService<ICustomItemInstructions, MenuItemRepository> {
  constructor() {
    super(new MenuItemRepository(), RESOURCE_NAME);
  }

  async getMenuItems(foodGroup: string, dietaryRestrictions: string[] | null) {
    const query = dietaryRestrictions ? { dietaryType: { $in: dietaryRestrictions } } : {};

    try {
      const menuItems = await this.find({ foodGroup, ...query });

      return menuItems;
    } catch (error) {
      throw error;
    }
  }

  async getAllMenuItems(dietaryType?: string[]) {
    try {
      const filter = dietaryType && dietaryType.length > 0 ? { dietaryType: dietaryType } : {};
      const allMenuItems = await this.find(filter);

      let mapped: { [key: string]: any[] } = {};
      allMenuItems.forEach((item: any) => {
        if (!mapped[item.foodGroup]) {
          mapped[item.foodGroup] = [];
        }
        mapped[item.foodGroup].push(item);
      });

      return mapped;
    } catch (error) {
      throw error;
    }
  }
}
