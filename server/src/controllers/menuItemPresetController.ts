import { Request, Response } from "express";
import { menuItemServices } from "../services/menuItemServices";

export class MenuItemPresetController{
    addMenuItem= async(req:Request,res:Response)=>{
        const {foodGroup}=req.params
        const menuItem={
            arrayToPushTo:foodGroup,
            menuItem:req.body
        }

        try {
            
            const newMenuItem=await menuItemServices.addMenuItem(menuItem)

            res.status(201).json(newMenuItem);
        } catch (error) {
            res.status(500).json({ message: "An error occurred while adding the menu item." });
        }
    }

    getMenuItems=async(req:Request,res:Response)=>{
        const {foodGroup}=req.params
        try {
            const menuItems= await menuItemServices.getMenuItems(foodGroup)
            res.status(201).json(menuItems);
        } catch (error) {
            res.status(500).json({ message: "An error occurred while retreiving the menu Items." });
        }
    }
}

export const menuItemController= new MenuItemPresetController()