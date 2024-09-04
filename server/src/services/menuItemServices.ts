import { fullMenuItemPresets } from "../models/menuItemModel";
import { updateCachedArrays, updateCachedDataPerItem } from "../utils/utils";

let cachedMenuItemData: { [key: string]: any } = {};

export class MenuItemService {
  static async addMenuItem(data: any) {
    try {
      const newMenuItem = await fullMenuItemPresets.create(data);

      cachedMenuItemData = updateCachedDataPerItem(cachedMenuItemData, newMenuItem);

      return newMenuItem;
    } catch (error) {
      throw error;
    }
  }

  static async getMenuItems(foodGroup: string) {
    if (cachedMenuItemData[foodGroup]) {
      return cachedMenuItemData[foodGroup];
    }

    try {
      const menuItems = await fullMenuItemPresets.find({ foodGroup: foodGroup });

      cachedMenuItemData = updateCachedArrays(cachedMenuItemData, menuItems, foodGroup);

      return menuItems;
    } catch (error) {
      throw error;
    }
  }
  static async getOneMenuItem(id: string) {
    if (cachedMenuItemData[id]) {
      return cachedMenuItemData[id];
    }

    try {
      const menuItem = await fullMenuItemPresets.findOne({ _id: id });

      cachedMenuItemData = updateCachedDataPerItem(cachedMenuItemData, menuItem);

      return menuItem;
    } catch (error) {
      throw error;
    }
  }
  static async getOneMenuItemByName(name: string) {
    if (cachedMenuItemData[name]) {
      return cachedMenuItemData[name];
    }

    try {
      const menuItem = await fullMenuItemPresets.findOne({ name });

      cachedMenuItemData = updateCachedDataPerItem(cachedMenuItemData, menuItem);

      return menuItem;
    } catch (error) {
      throw error;
    }
  }

  static async getAllMenuItems() {
    if (cachedMenuItemData[`all`]) {
      return cachedMenuItemData[`all`];
    }

    try {
      const allMenuItems = await fullMenuItemPresets.find();

      cachedMenuItemData = updateCachedArrays(cachedMenuItemData, allMenuItems, `all`);

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

      cachedMenuItemData = updateCachedDataPerItem(cachedMenuItemData, updatedMenuItem);

      return updatedMenuItem;
    } catch (error) {
      throw error;
    }
  }
  static async deleteMenuItem(id: string) {
    try {
      const deletedMenuItem = await fullMenuItemPresets.findOneAndRemove({ _id: id });

      cachedMenuItemData = updateCachedDataPerItem(cachedMenuItemData, deletedMenuItem, `delete`);

      return deletedMenuItem;
    } catch (error) {
      throw error;
    }
  }
}
