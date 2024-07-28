import { error } from "console";
import { exercisePresets } from "../models/exercisePresetModel";


export class ExercisePresetService {


    async addExercise(data: any) {
        try {

            const exercise = await exercisePresets.create(data)

            return exercise

        } catch (error) {
            throw error
        }
    }

    async getExercises() {
        try {

            const exercises = await exercisePresets.find()

            return exercises

        } catch (error) {
            throw error
        }
    }
    async getExercisesByMuscleGroup(muscleGroup: string) {
        try {

            const exercises = await exercisePresets.find({ muscleGroup: muscleGroup })

            return exercises

        } catch (error) {
            throw error
        }
    }

    async getExerciseById(id: string) {
        try {
            const exercise = await exercisePresets.findById(id)

            return exercise

        } catch (error) {
            throw error
        }
    }
    async deleteExercise(id: string) {
        try {

            const exercise = await exercisePresets.deleteOne({ _id: id })

            return exercise

        } catch (error) {
            throw error
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
            throw error
        }
    }
}

export const exercisePresetServices = new ExercisePresetService()