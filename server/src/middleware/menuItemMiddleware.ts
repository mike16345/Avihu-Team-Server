import { Request, Response, NextFunction } from "express";
import { fullMenuItemPresets, menuItemShcemaValidation } from "../models/menuItemModel";

export const validateMenuItem = async (req: Request, res: Response, next: NextFunction) => {
    const menuItem = req.body;
    const { id } = req.params

    if (!menuItem.dietaryType) {
        return res.status(400).json({ message: "dietary type is required" });
    }
    if (!menuItem.foodGroup) {
        return res.status(400).json({ message: "food group must be defined" });
    }

    if (!menuItem.itemName) {
        return res.status(400).json({ message: "menu item name is required" });
    }
    if (!menuItem.oneServing) {
        return res.status(400).json({ message: "menu item must have one serving measurments" });
    }
    if (!id) {
        const menuItemExists = await fullMenuItemPresets.findOne({ itemName: menuItem.itemName })

        if (menuItemExists) {
            return res.status(400).json({ message: "פריט כבר קיים במערכת" });
        }
    }

    delete menuItem.oneServing._id
    delete menuItem._id
    delete menuItem.__v

    const { error } = menuItemShcemaValidation.validate(menuItem)

    if (error) {
        return res.status(400).json({ message: error.message });
    }

    next()

}