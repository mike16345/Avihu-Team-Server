import { Request, Response, NextFunction } from "express";
import { RecordedSetJoiSchema } from "../models/recordedSetsModel";

export const validateRecordedSet = (req: Request, res: Response, next: NextFunction) => {
  const data = { ...req.body };
  if (!data.userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  if (!data.muscleGroup) {
    return res.status(400).json({ message: "muscleGroup is required" });
  }

  if (!data.exercise) {
    return res.status(400).json({ message: "exercise is required" });
  }

  delete data.userId;
  delete data.exercise;
  delete data.muscleGroup;

  const { error } = RecordedSetJoiSchema.validate(data);

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  next();
};
