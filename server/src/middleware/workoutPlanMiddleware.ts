import { Request, Response, NextFunction } from "express";
import {
  FullWorkoutPlanSchemaValidation,
  WorkoutPlanSchemaValidation,
} from "../models/workoutPlanModel";
import { StatusCode } from "../enums/StatusCode";
import { WorkoutPlanPresetSchemaValidation } from "../models/workoutPlanPresetModel";

export const validateWorkoutPlan = (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.userId;

  if (!id) {
    return res.status(StatusCode.BAD_REQUEST).json({ message: "User ID is required!" });
  }

  const { error } = FullWorkoutPlanSchemaValidation.validate(req.body);

  if (error) {
    return res.status(StatusCode.BAD_REQUEST).json({ message: error.message });
  }

  next();
};

export const validateWorkoutPlanPreset = (req: Request, res: Response, next: NextFunction) => {
  console.log("req body:", req.body);

  const { error } = WorkoutPlanPresetSchemaValidation.validate(req.body);
  console.log("error was caught", error);
  if (error) {
    return res.status(400).json({ message: error.message });
  }

  next();
};
