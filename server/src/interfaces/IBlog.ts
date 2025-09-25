export interface IBlog {
  title: string;
  content: string;
  imageUrl?: string;
  date: Date;
  group?: string;
  planType?: string;
  link?: string;
  views: string[];
  likes: string[];
}
