import { muscleGroupPresets } from "../models/muscleGroupModel";

export class MuscleGroupService {
    // 1. Put spaces before your return statements. 
    
    static async getAllMuscleGroups() {
        try {
            const allMuscleGroups = await muscleGroupPresets.find()
            return allMuscleGroups
        } catch (error) {
            return error
        }
    }

    static async getMuscleGroupById(id: string) {
        try {
            // findById
            const muscleGroup = await muscleGroupPresets.findOne({ _id: id })
            return muscleGroup
        } catch (error) {
            return error
        }
    }

    
    static async addMuscleGroup(muscleGroup: string) {
        // Read what I wrote in the controller and make the change. 
        
        try {
            const newMuscleGroup = await muscleGroupPresets.create({ name: muscleGroup })
            return newMuscleGroup
        } catch (error) {
            return error
        }
    }

    static async editMuscleGroup(muscleGroup: string, id: string) {
        try {
            const newMuscleGroup = await muscleGroupPresets.findOneAndUpdate(
                { _id: id },
                { name: muscleGroup },
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