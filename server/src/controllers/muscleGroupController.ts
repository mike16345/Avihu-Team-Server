import { Request, Response } from "express";
import { MuscleGroupService } from "../services/muscleGroupService";

export class MuscleGroupController {
    // You aren't specifying a status code when returning a response in all of your try/catch statements. 

    static async getAllMuscleGroups(req: Request, res: Response) {
        try {
            const allMuscleGroups = await MuscleGroupService.getAllMuscleGroups()

            res.send(allMuscleGroups)
        } catch (error) {
            return res.status(500).send(error);
        }
    }

    static async getMuscleGroupById(req: Request, res: Response) {
        const { id } = req.params
        try {
            const muscleGroup = await MuscleGroupService.getMuscleGroupById(id)

            res.send(muscleGroup)
        } catch (error) {
            return res.status(500).send(error);
        }
    }

    static async addMuscleGroup(req: Request, res: Response) {
        // The body contains exactly what you want to add to the database. 
        // Just do const muscleGroupToAdd = req.body
        // That way you don't need to do {name:muscleGroup} in the service method.
        const muscleGroup = req.body.name

        try {
            const newMuscleGroup = await MuscleGroupService.addMuscleGroup(muscleGroup)

            res.send(newMuscleGroup)
        } catch (error) {
            return res.status(500).send(error);
        }
    }

    static async editMuscleGroup(req: Request, res: Response) {
        const muscleGroup = req.body.name
        const { id } = req.params;

        try {
            const newMuscleGroup = await MuscleGroupService.editMuscleGroup(muscleGroup, id)

            res.send(newMuscleGroup)
        } catch (error) {
            return res.status(500).send(error);
        }
    }

    static async deleteMuscleGroup(req: Request, res: Response) {
        const { id } = req.params;

        try {
            const deletedMuscleGroup = await MuscleGroupService.deleteMuscleGroup(id)

            res.send(deletedMuscleGroup)
        } catch (error) {
            return res.status(500).send(error);
        }
    }
}