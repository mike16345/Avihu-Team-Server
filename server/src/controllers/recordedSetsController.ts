import { StatusCode } from "../enums/StatusCode";
import { RecordedSetsService } from "../services/recordedSetsService";
import { Request, Response } from "express";

export class RecordedSetsController {
  static async addRecordedSet(req: Request, res: Response) {
    const data = { ...req.body };

    const { userId, exercise, muscleGroup } = data;

    delete data.userId;
    delete data.muscleGroup;
    delete data.exercise;

    try {
      const response = await RecordedSetsService.addRecordedSet(
        userId,
        muscleGroup,
        exercise,
        data
      );

      res.status(StatusCode.CREATED).send(response);
    } catch (err: any) {
      res.status(500).send({ message: err.message });
    }
  }

  static async getRecordedSetsByUserId(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const response = await RecordedSetsService.getRecordedSetsByUserId(id);

      if (typeof response === "string") {
        res.status(404).send({ message: response });
      }

      res.status(200).send(response);
    } catch (err: any) {
      res.status(500).send({ message: err.message });
    }
  }

  static async getRecordedSetsByUserAndMuscle(req: Request, res: Response) {
    const { id, muscleGroup } = req.params;

    try {
      const response = await RecordedSetsService.getRecordedSetsByUserAndMuscleGroup(
        id,
        muscleGroup
      );

      if (typeof response === "string") {
        res.status(404).send({ message: response });
        return;
      }

      res.status(200).send(response);
    } catch (err: any) {
      res.status(500).send({ message: err.message });
    }
  }
}
