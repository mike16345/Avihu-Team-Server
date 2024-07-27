import { Request, Response, NextFunction } from "express";
import { exercisePresets, exercisePresetValidationSchema } from "../models/exercisePresetModel";

export const validateExercise = async (req: Request, res: Response, next: NextFunction) => {
    const exercise = req.body;
    const { id } = req.params;

    // There is no need to validate the exercise with all these if statements. The JOI schema validation will handle all of this already for you. 

    if (!exercise.name) {
        return res.status(400).json(`exercise must have a name`);
    }

    if (!exercise.linkToVideo) {
        return res.status(400).json(`exercise must have a video link`);
    }

    if (!exercise.muscleGroup) {
        return res.status(400).json(`exercise must be linked to a muscle group`);
    }

    // This one is fine. But why are you checking if there is no ID first. 
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