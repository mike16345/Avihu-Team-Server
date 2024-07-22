import { Request, Response, NextFunction } from "express";
import { menuItemShcemaValidation } from "../models/menuItemModel";

export const validateMenuItem=(req:Request,res:Response,next:NextFunction)=>{
    const menuItem=req.body;

    if (!menuItem.type) {
        return res.status(400).json({ message: "menu item type is required" });
    }
    
    if (!menuItem.itemName) {
        return res.status(400).json({ message: "menu item name is required" });
    }
    if (!menuItem.oneServing) {
        return res.status(400).json({ message: "menu item must have one serving measurments" });
    }

    const {error}= menuItemShcemaValidation.validate(menuItem)

    if (error) {
        return res.status(400).json({ message: error.message });
    }

    next()

}