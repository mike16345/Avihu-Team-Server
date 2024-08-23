import { StatusCode } from "../enums/StatusCode";
import { CheckInModel } from "../models/checkInModel";
import { User } from "../models/userModel";
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

  static async createCheckIn(req: Request, res: Response) {
    const { email } = req.body;

    try {
      const newCheckIn = await AnalyticsService.createNewCheckIn(email);

      if (!newCheckIn) {
        return res
          .status(StatusCode.INTERNAL_SERVER_ERROR)
          .send({ message: `error creating new check in` });
      }

      res.end();
    } catch (error) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: error });
    }
  }

  static async updateCheckIn(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const updatedCheckIn = await AnalyticsService.updateCheckIn(id);

      if (!updatedCheckIn) {
        return res
          .status(StatusCode.INTERNAL_SERVER_ERROR)
          .send({ message: `error updating check in` });
      }

      res.end();
    } catch (error) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: error });
    }
  }

  static async checkOffUser(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const checkedUser = await AnalyticsService.checkOffuser(id);

      if (!checkedUser) {
        return res.status(StatusCode.NOT_FOUND).send({ message: `user not found` });
      }

      res.send(checkedUser);
    } catch (error) {
      res.status(StatusCode.BAD_REQUEST).send({ message: error });
    }
  }
}
