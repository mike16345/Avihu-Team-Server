import mongoose from "mongoose";

export interface ILead {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone?: string;
  deviceId?: string;
  ip?: string;
  isContacted: boolean;
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
