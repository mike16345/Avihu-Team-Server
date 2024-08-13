import { Request, Response, NextFunction } from "express";
import { muscleGroupPresets } from "../models/muscleGroupModel";

export const checkIfMuscleGroupExists = async (req: Request, res: Response, next: NextFunction) => {
    const muscleGroup = req.body.name;

    const itemExists = await muscleGroupPresets.findOne({ name: muscleGroup })

    if (itemExists) {

        res.status(403).send(`קבוצת שריר כבר קיימת במערכת`)
    } else {
        next()
    }

}