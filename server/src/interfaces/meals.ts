export interface IMealItem {
  amount?: number;
  foodGroup?: string;
  item?: string;
}

export interface IMeal {
  date: Date;
  mealItems: IMealItem[];
}

type ISODateString = `${number}-${number}-${number}`;

export type RecordedMeal = {
  [date in ISODateString]?: IMealItem[];
};
