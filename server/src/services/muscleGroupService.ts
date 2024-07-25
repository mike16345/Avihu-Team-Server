import { muscleGroupPresets } from "../models/muscleGroupModel";

export class MuscleGroupService {
    static async getAllMuscleGroups() {
        try {
            const allMuscleGroups = await muscleGroupPresets.find()
            return allMuscleGroups
        } catch (error) {
            return error
        }
    }

    static async addMuscleGroup(muscleGroup: string) {
        try {
            const newMuscleGroup = await muscleGroupPresets.create({ itemName: muscleGroup })
            return newMuscleGroup
        } catch (error) {
            return error
        }
    }

    static async editMuscleGroup(muscleGroup: string, id: string) {
        try {
            const newMuscleGroup = await muscleGroupPresets.findOneAndUpdate(
                { _id: id },
                { itemName: muscleGroup },
                { new: true }
            )
            return newMuscleGroup
        } catch (error) {
            return error
        }
    }

    static async deleteMuscleGroup(id: string) {
        try {
            const deletedMuscleGroup = await muscleGroupPresets.findOneAndDelete({ _id: id })
            return deletedMuscleGroup
        } catch (error) {
            return error
        }
    }
}