import { muscleGroupPresets } from "../models/muscleGroupModel";

export class MuscleGroupService {

    static async getAllMuscleGroups() {
        try {
            const allMuscleGroups = await muscleGroupPresets.find()

            return allMuscleGroups
        } catch (error) {
            throw error
        }
    }

    static async getMuscleGroupById(id: string) {
        try {
            const muscleGroup = await muscleGroupPresets.findById(id)

            return muscleGroup
        } catch (error) {
            throw error
        }
    }


    static async addMuscleGroup(muscleGroup: string) {

        try {
            const newMuscleGroup = await muscleGroupPresets.create(muscleGroup)

            return newMuscleGroup
        } catch (error) {
            throw error
        }
    }

    static async editMuscleGroup(muscleGroup: string, id: string) {
        try {
            const newMuscleGroup = await muscleGroupPresets.findOneAndUpdate(
                { _id: id },
                muscleGroup,
                { new: true }
            )

            return newMuscleGroup
        } catch (error) {
            throw error
        }
    }

    static async deleteMuscleGroup(id: string) {
        try {
            const deletedMuscleGroup = await muscleGroupPresets.findOneAndDelete({ _id: id })

            return deletedMuscleGroup
        } catch (error) {
            throw error
        }
    }
}