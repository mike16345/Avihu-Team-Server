import { Request, Response, NextFunction } from "express";
import { exercisePresets, exercisePresetValidationSchema } from "../models/exercisePresetModel";

export const validateExercise = async (req: Request, res: Response, next: NextFunction) => {
    const exercise = req.body;
    const { id } = req.params;



    if (!id) {
        const exerciseExists = await exercisePresets.findOne({ name: exercise.name })
        if (exerciseExists) {
            return res.status(400).json(`תרגיל כבר קיים במערכת`);
        }
    }

    const { error } = exercisePresetValidationSchema.validate(exercise)

    if (error) {

        return res.status(400).json(error);
    }

    next()

}