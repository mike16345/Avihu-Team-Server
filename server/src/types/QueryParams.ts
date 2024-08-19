import { ObjectId } from "mongodb";

export type RecordedSetsQueryParams = {
  userId: ObjectId;
  muscleGroup: string;
  exercise: string;
};
