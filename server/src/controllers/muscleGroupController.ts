import { Request, Response } from "express";
import { MuscleGroupService } from "../services/muscleGroupService";
import { StatusCode } from "../enums/StatusCode";

export class MuscleGroupController {

    static async getAllMuscleGroups(req: Request, res: Response) {
        try {
            const allMuscleGroups = await MuscleGroupService.getAllMuscleGroups()

            res.status(StatusCode.OK).send(allMuscleGroups)
        } catch (error) {
            return res.status(StatusCode.NOT_FOUND).send(error);
        }
    }

    static async getMuscleGroupById(req: Request, res: Response) {
        const { id } = req.params
        try {
            const muscleGroup = await MuscleGroupService.getMuscleGroupById(id)

            res.status(StatusCode.OK).send(muscleGroup)
        } catch (error) {
            return res.status(StatusCode.NOT_FOUND).send(error);
        }
    }

    static async addMuscleGroup(req: Request, res: Response) {

        const muscleGroup = req.body

        try {
            const newMuscleGroup = await MuscleGroupService.addMuscleGroup(muscleGroup)

            res.status(StatusCode.CREATED).send(newMuscleGroup)
        } catch (error) {
            return res.status(StatusCode.BAD_REQUEST).send(error);
        }
    }

    static async editMuscleGroup(req: Request, res: Response) {
        const muscleGroup = req.body
        const { id } = req.params;

        try {
            const newMuscleGroup = await MuscleGroupService.editMuscleGroup(muscleGroup, id)

            res.status(StatusCode.OK).send(newMuscleGroup)
        } catch (error) {
            return res.status(StatusCode.NOT_FOUND).send(error);
        }
    }

    static async deleteMuscleGroup(req: Request, res: Response) {
        const { id } = req.params;

        try {
            const deletedMuscleGroup = await MuscleGroupService.deleteMuscleGroup(id)

            res.status(StatusCode.OK).send(deletedMuscleGroup)
        } catch (error) {
            return res.status(StatusCode.NOT_FOUND).send(error);
        }
    }
}