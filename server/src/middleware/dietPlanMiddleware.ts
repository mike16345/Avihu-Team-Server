import { Request, Response, NextFunction } from "express";
import { DietPlanSchemaValidation } from "../models/dietPlanModel";
import { removeNestedIds } from "../utils/utils";
import { StatusCode } from "../enums/StatusCode";

export const validateDietPlan = (req: Request, res: Response, next: NextFunction) => {
  const data = removeNestedIds(req.body);

  const { error } = DietPlanSchemaValidation.validate(data);

  if (error) {
    return res.status(StatusCode.BAD_REQUEST).json({ message: error.message });
  }

  next();
};
