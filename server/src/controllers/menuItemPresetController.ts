import { Request, Response } from "express";
import { menuItemServices } from "../services/menuItemServices";

export class MenuItemPresetController {
    addMenuItem = async (req: Request, res: Response) => {
        const menuItem = req.body;

        try {

            const newMenuItem = await menuItemServices.addMenuItem(menuItem)

            res.status(201).json(newMenuItem);
        } catch (error) {
            res.status(500).json({ message: "An error occurred while adding the menu item." });
        }
    }

    getMenuItems = async (req: Request, res: Response) => {
        const { foodGroup } = req.params
        try {
            const menuItems = await menuItemServices.getMenuItems(foodGroup)
            res.status(201).json(menuItems);
        } catch (error) {
            res.status(500).json({ message: "An error occurred while retreiving the menu Items." });
        }
    }
    getAllMenuItems = async (req: Request, res: Response) => {

        try {
            const allMenuItems = await menuItemServices.getAllMenuItems()
            res.status(201).json(allMenuItems);
        } catch (error) {
            res.status(500).json({ message: "An error occurred while retreiving the menu Items." });
        }
    }
    editMenuItem = async (req: Request, res: Response) => {
        const newMenuItem = req.body;
        const { id } = req.params;


        try {
            const updatedMenuItem = await menuItemServices.updateMenuItem(newMenuItem, id)
            res.status(201).json(updatedMenuItem);
        } catch (error) {
            res.status(500).json({ message: "An error occurred while retreiving the menu Items." });
        }
    }

    deleteMenuItem = async (req: Request, res: Response) => {
        const { id } = req.params;


        try {
            const deletedMenuItem = await menuItemServices.deleteMenuItem(id)
            res.status(201).json(deletedMenuItem);
        } catch (error) {
            res.status(500).json({ message: "An error occurred while retreiving the menu Items." });
        }
    }
}

export const menuItemController = new MenuItemPresetController()