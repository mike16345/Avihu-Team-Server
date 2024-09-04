import { fullMenuItemPresets } from "../models/menuItemModel";
import { Cache } from "../utils/cache";

let cachedMenuItems = new Cache<any>();

export class MenuItemService {
  static async addMenuItem(data: any) {
    try {
      const newMenuItem = await fullMenuItemPresets.create(data);
      cachedMenuItems.invalidate("all");

      return newMenuItem;
    } catch (error) {
      throw error;
    }
  }

  static async getMenuItems(foodGroup: string) {
    const cached = cachedMenuItems.get(foodGroup);

    try {
      const menuItems = cached || (await fullMenuItemPresets.find({ foodGroup: foodGroup }));
      cachedMenuItems.set(foodGroup, menuItems);

      return menuItems;
    } catch (error) {
      throw error;
    }
  }
  static async getOneMenuItem(id: string) {
    const cached = cachedMenuItems.get(id);

    try {
      const menuItem = cached || (await fullMenuItemPresets.findOne({ _id: id }));
      cachedMenuItems.set(id, menuItem);

      return menuItem;
    } catch (error) {
      throw error;
    }
  }
  static async getOneMenuItemByName(name: string) {
    const cached = cachedMenuItems.get(name);

    try {
      const menuItem = cached || (await fullMenuItemPresets.findOne({ name }));
      cachedMenuItems.set(name, menuItem);

      return menuItem;
    } catch (error) {
      throw error;
    }
  }

  static async getAllMenuItems() {
    const cached = cachedMenuItems.get(`all`);
    try {
      const allMenuItems = cached || (await fullMenuItemPresets.find());
      cachedMenuItems.set(`all`, allMenuItems);

      return allMenuItems;
    } catch (error) {
      throw error;
    }
  }

  static async updateMenuItem(newMenuItem: any, id: string) {
    try {
      const updatedMenuItem = await fullMenuItemPresets.findOneAndUpdate({ _id: id }, newMenuItem, {
        new: true,
      });
      cachedMenuItems.invalidateAll();

      return updatedMenuItem;
    } catch (error) {
      throw error;
    }
  }

  static async deleteMenuItem(id: string) {
    try {
      const deletedMenuItem = await fullMenuItemPresets.findOneAndRemove({ _id: id });
      cachedMenuItems.invalidateAll();

      return deletedMenuItem;
    } catch (error) {
      throw error;
    }
  }
}
