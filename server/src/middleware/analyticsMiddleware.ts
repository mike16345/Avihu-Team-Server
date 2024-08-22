import { CheckInModel } from "../models/checkInModel";
import { Request, Response, NextFunction } from "express";

export const scheduleUserChecks = (req: Request, res: Response, next: NextFunction) => {
  CheckInModel.find().then((users) => {
    users.forEach((user) => {
      const lastUpdatedAt = user.lastUpdatedAt.getTime();
      const remindInMillieSeconds = user.remindIn * 1000;
      const remindAt = lastUpdatedAt + remindInMillieSeconds;

      if (Date.now() > remindAt) {
        user.isChecked = false;
        user.lastUpdatedAt = new Date();

        user
          .save()
          .then(() => {
            console.log(`User ${user._id} isChecked updated to false and lastUpdatedAt updated.`);
          })
          .catch((err) => {
            console.error(`Error updating user ${user._id}:`, err);
          });
      }
    });
    next();
  });
};
