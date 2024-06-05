import { ObjectId } from "mongodb";

export interface IUser {
  id: ObjectId;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}
