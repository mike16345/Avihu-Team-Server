import { Request, Response } from "express";
import { exercisePresetValidationSchema } from "../models/exercisePresetModel";
import { exercisePresetServices } from "../services/exercisePresetService";
import { StatusCode } from "../enums/StatusCode";

class ExercisePresetController {


    addExercise = async (req: Request, res: Response) => {
        const exercise = req.body;

        try {

            const excercisePreset = await exercisePresetServices.addExercise(exercise)

            res.status(StatusCode.CREATED).send(excercisePreset)
        } catch (error) {
            res.status(StatusCode.BAD_REQUEST).send(error)
        }
    }
    getExercises = async (req: Request, res: Response) => {
        try {
            const allExercises = await exercisePresetServices.getExercises()

            res.status(StatusCode.OK).send(allExercises)
        } catch (error) {
            res.status(StatusCode.NOT_FOUND).send(error)
        }
    }
    getExercisesByMusceGroup = async (req: Request, res: Response) => {
        const { muscleGroup } = req.params

        try {
            const muscleGroupExercises = await exercisePresetServices.getExercisesByMuscleGroup(muscleGroup)

            res.status(StatusCode.OK).send(muscleGroupExercises)
        } catch (error) {
            res.status(StatusCode.NOT_FOUND).send(error)
        }
    }
    getExerciseById = async (req: Request, res: Response) => {

        const { id } = req.params

        try {
            const exercise = await exercisePresetServices.getExerciseById(id)

            res.status(StatusCode.OK).send(exercise)
        } catch (error) {
            res.status(StatusCode.NOT_FOUND).send(error)
        }
    }

    deleteExercise = async (req: Request, res: Response) => {

        const { id } = req.params

        try {
            const exercise = await exercisePresetServices.deleteExercise(id)

            res.status(StatusCode.OK).send(exercise)
        } catch (error) {
            res.status(StatusCode.NOT_FOUND).send(error)
        }
    }
    updateExercise = async (req: Request, res: Response) => {

        const { id } = req.params
        const newExercise = req.body

        try {
            // You should check if exercise is null or not. Otherwise you are returning an OK response instead of an error. ??
            const exercise = await exercisePresetServices.updateExercise(id, newExercise)

            res.status(StatusCode.OK).send(exercise)
        } catch (error) {
            res.status(StatusCode.NOT_FOUND).send(error)
        }
    }
}

export const exercisePresetController = new ExercisePresetController()