import { Request, Response, NextFunction } from "express";
import { DietPlanSchemaValidation } from "../models/dietPlanModel";
export const validateDietPlan = (req: Request, res: Response, next: NextFunction) => {
  const data = req.body;
  console.log("data", data);

  const { error } = DietPlanSchemaValidation.validate(data);

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  next();
};
