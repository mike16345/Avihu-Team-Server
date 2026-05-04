import { APIGatewayEvent } from "aws-lambda";
import { User } from "../models/userModel";
import { createValidatorResponse } from "../utils/utils";

export const scheduleUserChecks = async (event: APIGatewayEvent) => {
  try {
    const users = await User.find({
      isDeleted: false,
      role: "user",
      checkInAt: { $exists: true },
      remindIn: { $exists: true },
    });
    for (const user of users) {
      if (typeof user.checkInAt !== "number" || typeof user.remindIn !== "number") {
        continue;
      }

      if (Date.now() > user.checkInAt) {
        const oneThousand = 1000;
        const remindInMillieSeconds = user.remindIn * oneThousand;
        user.checkInAt = Date.now() + remindInMillieSeconds;
        user.isChecked = false;

        await User.findByIdAndUpdate(user._id, user);
      }
    }
  } catch (err) {
    createValidatorResponse(false, `Error updating users: ${err}`);
  }
  return createValidatorResponse(true);
};
