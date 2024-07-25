import { Request, Response, NextFunction } from "express";
import { muscleGroupPresets } from "../models/muscleGroupModel";
export const checkIfItemExixts = async (req: Request, res: Response, next: NextFunction) => {
    const muscleGroup = req.body.itemName;

    const itemExists = await muscleGroupPresets.findOne({ itemName: muscleGroup })
    if (itemExists) {
        res.status(403).send(`קבוצת שריר כבר קיימת במערכת`)
    } else {
        next()
    }

}