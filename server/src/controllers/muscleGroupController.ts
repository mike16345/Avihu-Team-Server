import { Request, Response } from "express";
import { MuscleGroupService } from "../services/muscleGroupService";

export class MuscleGroupController {
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
        const muscleGroup = req.body.itemName

        try {
            const newMuscleGroup = await MuscleGroupService.addMuscleGroup(muscleGroup)

            res.send(newMuscleGroup)
        } catch (error) {
            return res.status(500).send(error);
        }
    }

    static async editMuscleGroup(req: Request, res: Response) {
        const muscleGroup = req.body.itemName
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