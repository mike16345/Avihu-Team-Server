import { StatusCode } from "../enums/StatusCode";
import { AnalyticsService } from "../services/analyticsService";
import { Request, Response } from "express";

export class AnalyticsController {
  static async getAllCheckInUsers(req: Request, res: Response) {
    try {
      const allCheckInUsers = await AnalyticsService.getAllCheckInUsers();

      res.send(allCheckInUsers);
    } catch (error) {
      res.status(StatusCode.NOT_FOUND).send({ message: error });
    }
  }

  static async checkOffUser(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const checkedUser = await AnalyticsService.checkOffuser(id);

      if (!checkedUser) {
        res.status(StatusCode.NOT_FOUND).send({ message: `user not found` });
      }

      res.send(checkedUser);
    } catch (error) {
      res.status(StatusCode.BAD_REQUEST).send({ message: error });
    }
  }
}
