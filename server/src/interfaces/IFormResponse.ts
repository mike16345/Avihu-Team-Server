import { Types } from "mongoose";

export interface IFormResponseQuestion {
  _id: string;
  type: string;
  question: string;
  answer?: any;
}

export interface IFormResponseSection {
  _id: string;
  title: string;
  questions: IFormResponseQuestion[];
}

export interface IFormResponse {
  formId: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  submittedAt: Date;
  formTitle?: string;
  formType?: string;
  sections: IFormResponseSection[];
  isChecked: boolean
  createdAt?: Date;
  updatedAt?: Date;
}
