import { Request, Response } from "express";
import { WorkoutPlanPresetService } from "../services/workoutPlanPresetService";

export class WorkoutPlanPresetsController {
  static async addWorkoutPlanPreset(req: Request, res: Response) {
    try {
      const data = req.body;

      const workoutPlanPreset = await WorkoutPlanPresetService.addWorkoutPreset(data);

      if (!workoutPlanPreset) {
        res.status(400).send({ message: "There was an error adding the workout plan preset!" });
      }

      res.status(201).send(workoutPlanPreset);
    } catch (err: any) {
      res.status(500).send({ message: err.message });
    }
  }
}
