import mongoose from "mongoose";

export interface IBlog {
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
