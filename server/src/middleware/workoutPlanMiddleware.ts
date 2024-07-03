import { Request, Response, NextFunction } from "express";
import { FullWorkoutPlanSchemaValidation } from "../models/workoutPlanModel";

export const validateWorkoutPlan = (req: Request, res: Response, next: NextFunction) => {
  const { error } = FullWorkoutPlanSchemaValidation.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  next();
};
