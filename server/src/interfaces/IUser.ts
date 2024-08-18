import { ObjectId } from "mongodb";

export interface IUser {
  id: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone:string
  dietaryType:string[];
  password: string;
  dateJoined: Date;
  dateFinished:Date;
  planType:string;
}
