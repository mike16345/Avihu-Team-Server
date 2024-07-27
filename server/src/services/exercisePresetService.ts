import { error } from "console";
import { exercisePresets } from "../models/exercisePresetModel";


export class ExercisePresetService {
    async addExercise(data: any) {
        try {

            const exerciseExists = await exercisePresets.count(data)
            if (Boolean(exerciseExists)) {
                throw new Error(`אי אפשר להוסיף פריט שכבר קיים לרשימה!`);
            }


            const exercise = await exercisePresets.create(data)

            return exercise

        } catch (error) {
            return Promise.reject(error)
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

            const exercise = await exercisePresets.updateOne(
                { _id: id },
                { $set: { name: newExercise } }
            )

            return exercise

        } catch (error) {
            return error
        }
    }
}

export const exercisePresetServices = new ExercisePresetService()