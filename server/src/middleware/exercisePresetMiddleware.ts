import { Request, Response, NextFunction } from "express";
import { exercisePresets, exercisePresetValidationSchema } from "../models/exercisePresetModel";

export const validateExercise = async (req: Request, res: Response, next: NextFunction) => {
    const exercise = req.body;
    const { id } = req.params;

    if (!exercise.itemName) {
        return res.status(400).json(`exercise must have a name`);
    }

    if (!exercise.linkToVideo) {
        return res.status(400).json(`exercise must have a video link`);
    }

    if (!exercise.muscleGroup) {
        return res.status(400).json(`exercise must be linked to a muscle group`);
    }

    if (!id) {
        const exerciseExists = await exercisePresets.findOne({ itemName: exercise.itemName })
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