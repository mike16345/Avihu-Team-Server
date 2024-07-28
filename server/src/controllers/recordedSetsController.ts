import { StatusCode } from "../enums/StatusCode";
import { RecordedSetsService } from "../services/recordedSetsService";
import { Request, Response } from "express";
import { RecordedSetsQueryParams } from "../types/QueryParams";
import { ObjectId } from "mongodb";

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
      res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  }

  static async getRecordedSetsByUserId(req: Request, res: Response) {
    const { id } = req.params;
    const query: Partial<RecordedSetsQueryParams> = { ...req.query };

    try {
      const objectId = new ObjectId(id);
      query.userId = objectId;

      const response = await RecordedSetsService.getRecordedSetsByUserId(query);

      if (typeof response === "string") {
        res.status(StatusCode.BAD_REQUEST).send({ message: response });
        return;
      }

      res.status(StatusCode.OK).send(response);
    } catch (err: any) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  }

  static async getUserRecordedExerciseNamesByMuscleGroup(req: Request, res: Response) {
    const { id } = req.params;

    if (!req.query.muscleGroup) {
      res.status(StatusCode.BAD_REQUEST).send({ message: "muscleGroup query is missing!" });
      return;
    }

    try {
      const query = { ...req.query, userId: new ObjectId(id) };
      const response = await RecordedSetsService.getUserRecordedExerciseNamesByMuscleGroup(query);

      if (typeof response === "string") {
        res.status(StatusCode.NOT_FOUND).send({ message: response });
        return;
      }

      res.status(StatusCode.OK).send(response);
    } catch (err: any) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  }
}
