import { CheckInModel } from "../models/checkInModel";
import schedule from "node-schedule";

export const removeNestedIds: any = (doc: any) => {
  if (Array.isArray(doc)) {
    return doc.map((item) => removeNestedIds(item));
  } else if (doc !== null && typeof doc === "object") {
    const newDoc = { ...doc };
    delete newDoc._id;
    for (const key in newDoc) {
      if (newDoc.hasOwnProperty(key)) {
        newDoc[key] = removeNestedIds(newDoc[key]);
      }
    }
    return newDoc;
  }
  return doc;
};

export const scheduleUserChecks = () => {
  CheckInModel.find()
    .then((users) => {
      users.forEach((user) => {
        const expiresAt = user.expiresAt;

        const job = schedule.scheduleJob({ start: expiresAt, rule: "*/1 * * * *" }, function () {
          user.isChecked = false;
          user.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
          user
            .save()
            .then(() => {
              console.log(`User ${user._id} isChecked updated to false.`);
            })
            .catch((err) => {
              console.error(`Error updating user ${user._id}:`, err);
            });
        });
      });
    })
    .catch((err) => {
      console.error("Error finding users:", err);
    });
};
