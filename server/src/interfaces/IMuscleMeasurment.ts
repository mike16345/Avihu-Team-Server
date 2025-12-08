export interface IMuscleMeasurement {
  date: string;
  chest: number;
  arm: number;
  waist: number;
  glutes: number;
  thigh: number;
  calf: number;
}

export interface IUserMuscleMeasurements {
  userId: string;
  measurements: IMuscleMeasurement[];
}
