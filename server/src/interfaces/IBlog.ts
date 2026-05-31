import mongoose from "mongoose";
import { IModel } from "./IModel";

export interface IBlog extends IModel {
  title: string;
  subtitle: string;
  content: string;
  imageUrl?: string;
  date: Date;
  group: mongoose.Types.ObjectId;
  planType?: string;
  link?: string;
  views: string[];
  likes: string[];
}
