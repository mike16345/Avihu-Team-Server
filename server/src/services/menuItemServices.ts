import { fullMenuItemPresets } from "../models/menuItemModel";

export class MenuItemService {
    // Spaces before returns. 
    // Don't do spaces after starting a try catch. 
    async addMenuItem(data: any,) {
        try {

            const newMenuItem = fullMenuItemPresets.create(data)

            return newMenuItem
        } catch (error) {
            return error
        }
    }

    async getMenuItems(foodGroup: string) {
        try {
            const menuItems = await fullMenuItemPresets.find({ foodGroup: foodGroup })
            return menuItems

        } catch (error) {
            return error
        }
    }
    async getOneMenuItem(id: string) {
        try {
            const menuItem = await fullMenuItemPresets.findOne({ _id: id })

            return menuItem

        } catch (error) {
            return error
        }
    }

    async getAllMenuItems() {
        try {
            const allMenuItems = await fullMenuItemPresets.find()
            return allMenuItems

        } catch (error) {
            return error
        }
    }

    async updateMenuItem(newMenuItem: any, id: string) {
        try {
            const updatedMenuItem = await fullMenuItemPresets.findOneAndUpdate(
                { _id: id },
                newMenuItem,
                { new: true }
            )
            return updatedMenuItem

        } catch (error) {
            return error
        }
    }
    async deleteMenuItem(id: string) {
        try {
            const deletedMenuItem = await fullMenuItemPresets.findOneAndRemove({ _id: id })
            return deletedMenuItem

        } catch (error) {
            return error
        }
    }
}

export const menuItemServices = new MenuItemService()