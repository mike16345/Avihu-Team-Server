import { error } from "console";
import { exercisePresets } from "../models/exercisePresetModel";


export class ExercisePresetService {
    async addExercise(data: any) {
        try {

            const exercise = await exercisePresets.create(data)

            return exercise

        } catch (error) {
            return error
        }
    }

    async getExercises() {
        try {

            const exercises = await exercisePresets.find()

            return exercises

        } catch (error) {
            return error
        }
    }
    async getExercisesByMuscleGroup(muscleGroup: string) {
        try {

            const exercises = await exercisePresets.find({ muscleGroup: muscleGroup })

            return exercises

        } catch (error) {
            return error
        }
    }

    async getExerciseById(id: string) {
        try {

            const exercise = await exercisePresets.findOne({ _id: id })

            return exercise

        } catch (error) {
            return error
        }
    }
    async deleteExercise(id: string) {
        try {

            const exercise = await exercisePresets.deleteOne({ _id: id })

            return exercise

        } catch (error) {
            return error
        }
    }
    async updateExercise(id: string, newExercise: any) {
        try {

            const exercise = await exercisePresets.findOneAndUpdate(
                { _id: id },
                newExercise
            )

            return exercise

        } catch (error) {
            return error
        }
    }
}

export const exercisePresetServices = new ExercisePresetService()