import { Request, Response, NextFunction } from "express";
import { muscleGroupPresets } from "../models/muscleGroupModel";

// Rename function to be a little more understandable at first glance. checkIfMuscleGroupExists for example. 
export const checkIfItemExixts = async (req: Request, res: Response, next: NextFunction) => {
    const muscleGroup = req.body.name;

    const itemExists = await muscleGroupPresets.findOne({ name: muscleGroup })
    
    // Replace with status code.
    if (itemExists) {
        res.status(403).send(`קבוצת שריר כבר קיימת במערכת`)
    } else {
        next()
    }

}