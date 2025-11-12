import mongoose from "mongoose";

export interface IUnsentLead {
  _id?: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone?: string;
  source?: string;
  deviceId?: string;
  errorMessage?: string;
  retryCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}
