export interface IMuscleMeasurement {
  date: string;
  chest: number;
  bicep: number;
  shoulder: number;
  back: number;
  leg: number;
}

export interface IUserMuscleMeasurements {
  userId: string;
  measurements: IMuscleMeasurement[];
}
