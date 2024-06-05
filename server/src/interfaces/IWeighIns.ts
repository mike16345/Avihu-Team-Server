import { ObjectId } from "mongodb";

export interface IWeighIn {
  date: Date;
  weight: number;
}

export interface IWeighIns {
  id: ObjectId;
  userId: ObjectId;
  weighIns: IWeighIn[];
}
