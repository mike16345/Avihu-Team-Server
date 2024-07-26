import { Request, Response } from "express";
import { WorkoutPlanPresetService } from "../services/workoutPlanPresetService";
import mongoose from "mongoose";
import { StatusCode } from "../enums/StatusCode";
import { STATUS_CODES } from "http";

export class WorkoutPlanPresetsController {
  static async addWorkoutPlanPreset(req: Request, res: Response) {
    try {
      const data = req.body;

      const workoutPlanPreset = await WorkoutPlanPresetService.addWorkoutPlanPreset(data);

      if (!workoutPlanPreset) {
        res.status(400).send({ message: "There was an error adding the workout plan preset!" });
      }

      res.status(StatusCode.CREATED).send(workoutPlanPreset);
    } catch (err: any) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  }

  static async updateWorkoutPlanPreset(req: Request, res: Response) {
    const id = req.params.presetId;
    const data = req.body;

    try {
      const updatedWorkoutPlanPreset = await WorkoutPlanPresetService.updateWorkoutPlanPreset(
        id,
        data
      );

      if (!updatedWorkoutPlanPreset) {
        return res
          .status(StatusCode.NOT_FOUND)
          .json({ message: "Workout plan preset was not found!." });
      }

      return res.status(StatusCode.OK).send(updatedWorkoutPlanPreset);
    } catch (err: any) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  }

  static async deleteWorkoutPlanPreset(req: Request, res: Response) {
    const id = req.params.presetId;

    if (!id) {
      return res
        .status(StatusCode.BAD_REQUEST)
        .json({ message: "Workout plan preset ID is required!" });
    }

    try {
      const deletedWorkoutPlanPreset = await WorkoutPlanPresetService.deleteWorkoutPlanPreset(id);

      if (!deletedWorkoutPlanPreset) {
        return res
          .status(StatusCode.NOT_FOUND)
          .json({ message: "Workout plan preset was not found!" });
      }

      res.status(StatusCode.OK).send(deletedWorkoutPlanPreset);
    } catch (err: any) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  }

  static async getAllWorkoutPlanPresets(req: Request, res: Response) {
    try {
      const workoutPlanPresets = await WorkoutPlanPresetService.getAllWorkoutPlanPresets();

      res.status(StatusCode.OK).send(workoutPlanPresets);
    } catch (err: any) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  }

  static async getWorkoutPlanPresetById(req: Request, res: Response) {
    const id = req.params.presetId;
    if (!id) {
      return res
        .status(StatusCode.BAD_REQUEST)
        .json({ message: "Workout plan preset ID is required!" });
    }
    try {
      const workoutPlanPreset = await WorkoutPlanPresetService.getWorkoutPlanPresetById(id);
      if (!workoutPlanPreset) {
        return res
          .status(StatusCode.NOT_FOUND)
          .json({ message: "Workout plan preset was not found!" });
      }
      res.status(StatusCode.OK).send(workoutPlanPreset);
    } catch (err: any) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  }
}
