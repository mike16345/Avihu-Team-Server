import { Request, Response, NextFunction } from "express";
import { FullWorkoutPlanSchemaValidation } from "../models/workoutPlanModel";

export const validateWorkoutPlan = (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.userId;

  if (!id) {
    return res.status(400).json({ message: "User ID is required!" });
  }

  const { error } = FullWorkoutPlanSchemaValidation.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  next();
};

export const validateWorkoutPreset = (req: Request, res: Response, next: NextFunction) => {
  const { error } = FullWorkoutPlanSchemaValidation.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.message });
  }
  next();
};
