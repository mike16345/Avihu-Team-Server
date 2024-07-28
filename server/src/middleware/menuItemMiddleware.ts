import { Request, Response, NextFunction } from "express";
import { fullMenuItemPresets, menuItemShcemaValidation } from "../models/menuItemModel";

export const validateMenuItem = async (req: Request, res: Response, next: NextFunction) => {
    const menuItem = req.body;
    const { id } = req.params
    

    if (!id) {
        const menuItemExists = await fullMenuItemPresets.findOne({ name: menuItem.name })

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