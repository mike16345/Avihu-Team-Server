import { CheckInModel } from "../models/checkInModel";
import { Request, Response, NextFunction } from "express";

export const scheduleUserChecks = (req: Request, res: Response, next: NextFunction) => {
  CheckInModel.find().then((users) => {
    users.forEach((user) => {
      const lastUpdatedAt = new Date(user.lastUpdatedAt).getTime();
      const remindInSeconds = user.remindIn;
      const remindAt = lastUpdatedAt + remindInSeconds * 1000;

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
