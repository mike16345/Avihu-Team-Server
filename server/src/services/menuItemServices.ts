import { fullMenuItemPresets } from "../models/menuItemModel";

export class MenuItemService{
    async addMenuItem(data:any,){
        const {menuItem,arrayToPushTo}=data
        try {

            const newMenuItem= fullMenuItemPresets.findOneAndUpdate(
                {},
                {$push:{[arrayToPushTo]:menuItem}},
                { new: true, upsert: true }
            )

            return newMenuItem
        } catch (error) {
            return error
        }
    }

    async getMenuItems(foodGroup:string){
        try {
            const menuItems= await fullMenuItemPresets.findOne({
                [foodGroup]: { $exists: true, $ne: [] } 
            })
            console.log(menuItems);
            
        } catch (error) {
            return error
        }
    }
}

export const menuItemServices= new MenuItemService()