import { Request, Response, NextFunction } from "express";
import { DietPlanSchemaValidation } from "../models/dietPlanModel";
import { removeNestedIds } from "../utils/utils";
import { StatusCode } from "../enums/StatusCode";
import { DietPlanPresetSchemaValidation } from "../models/dietPlanPresetModel";

export const validateDietPlan = (req: Request, res: Response, next: NextFunction) => {
  const data = removeNestedIds(req.body);

  const { error } = DietPlanSchemaValidation.validate(data);

  if (error) {
    return res.status(StatusCode.BAD_REQUEST).send({ message: error.message });
  }

  next();
};

export const validateDietPlanPreset = (req: Request, res: Response, next: NextFunction) => {
  const data = removeNestedIds(req.body);

  const { error } = DietPlanPresetSchemaValidation.validate(req.body);

  if (error) {
    return res.status(400).send({ message: error.message });
  }

  next();
};
