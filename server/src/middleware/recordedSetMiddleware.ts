import { Request, Response, NextFunction } from "express";
import { RecordedSetJoiSchema } from "../models/recordedSetsModel";

export const validateRecordedSet = (req: Request, res: Response, next: NextFunction) => {
  const { userId, muscleGroup, exercise, recordedSet } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  if (!muscleGroup) {
    return res.status(400).json({ message: "muscleGroup is required" });
  }

  if (!exercise) {
    return res.status(400).json({ message: "exercise is required" });
  }

  const { error } = RecordedSetJoiSchema.validate(recordedSet);

  if (error) {
    console.log("error here");
    return res.status(400).json({ message: error.message });
  }
  next();
};
