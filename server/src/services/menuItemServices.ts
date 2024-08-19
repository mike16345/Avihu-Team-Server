import { fullMenuItemPresets } from "../models/menuItemModel";

export class MenuItemService {
  async addMenuItem(data: any) {
    try {
      const newMenuItem = fullMenuItemPresets.create(data);

      return newMenuItem;
    } catch (error) {
      throw error;
    }
  }

  async getMenuItems(foodGroup: string) {
    try {
      const menuItems = await fullMenuItemPresets.find({ foodGroup: foodGroup });

      return menuItems;
    } catch (error) {
      throw error;
    }
  }
  async getOneMenuItem(id: string) {
    try {
      const menuItem = await fullMenuItemPresets.findOne({ _id: id });

      return menuItem;
    } catch (error) {
      throw error;
    }
  }

  async getAllMenuItems() {
    try {
      const allMenuItems = await fullMenuItemPresets.find();

      return allMenuItems;
    } catch (error) {
      throw error;
    }
  }

  async updateMenuItem(newMenuItem: any, id: string) {
    try {
      const updatedMenuItem = await fullMenuItemPresets.findOneAndUpdate({ _id: id }, newMenuItem, {
        new: true,
      });

      return updatedMenuItem;
    } catch (error) {
      throw error;
    }
  }
  async deleteMenuItem(id: string) {
    try {
      const deletedMenuItem = await fullMenuItemPresets.findOneAndRemove({ _id: id });

      return deletedMenuItem;
    } catch (error) {
      throw error;
    }
  }
}

export const menuItemServices = new MenuItemService();
