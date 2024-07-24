import { Request, Response } from "express";
import { exercisePresetValidationSchema } from "../models/exercisePresetModel";
import { exercisePresetServices } from "../services/exercisePresetService";

class ExercisePresetController {
    addExercise = async (req: Request, res: Response) => {
        const exercise = req.body;

        try {

            const excercisePreset = await exercisePresetServices.addExercise(exercise)

            res.status(201).json(excercisePreset)
        } catch (error) {
            res.status(500).json(error)
        }
    }
    getExercises = async (req: Request, res: Response) => {
        try {
            const allExercises = await exercisePresetServices.getExercises()

            res.status(201).json(allExercises)
        } catch (error) {
            res.status(500).json({ message: `An error occured while locating the exercise presets` })
        }
    }
    getExerciseById = async (req: Request, res: Response) => {

        const { id } = req.params

        try {
            const exercise = await exercisePresetServices.getExerciseById(id)

            res.status(201).json(exercise)
        } catch (error) {
            res.status(500).json({ message: `An error occured while locating the exercise presets` })
        }
    }

    deleteExercise = async (req: Request, res: Response) => {

        const { id } = req.params

        try {
            const exercise = await exercisePresetServices.deleteExercise(id)

            res.status(201).json(exercise)
        } catch (error) {
            res.status(500).json({ message: `An error occured while locating the exercise presets` })
        }
    }
    updateExercise = async (req: Request, res: Response) => {

        const { id } = req.params
        const newExercise = req.body

        try {
            const exercise = await exercisePresetServices.updateExercise(id, newExercise)

            res.status(201).json(exercise)
        } catch (error) {
            res.status(500).json({ message: `An error occured while locating the exercise presets` })
        }
    }
}

export const exercisePresetController = new ExercisePresetController()