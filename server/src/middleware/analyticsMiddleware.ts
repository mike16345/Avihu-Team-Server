import { APIGatewayEvent } from "aws-lambda";
import { User } from "../models/userModel";
import { createValidatorResponse } from "../utils/utils";

export const scheduleUserChecks = (event: APIGatewayEvent) => {
  User.find().then((users) => {
    users.forEach((user) => {
      if (Date.now() > user.checkInAt) {
        const oneThousand = 1000;
        const remindInMillieSeconds = user.remindIn * oneThousand;
        user.isChecked = false;
        user.checkInAt = Date.now() + remindInMillieSeconds;

        user
          .save()
          .then(() => {
            console.log(`User ${user._id} isChecked updated to false and lastUpdatedAt updated.`);
          })
          .catch((err) => {
            return createValidatorResponse(false, `Error updating user ${user._id}:${err}`);
          });
      }
    });
  });
  return createValidatorResponse(true);
};
