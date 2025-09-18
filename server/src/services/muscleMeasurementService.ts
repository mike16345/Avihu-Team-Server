import { BaseService } from "./BaseService";
import { MuscleMeasurementsRepository } from "../repositories/MuscleMeasurments/MuscleMeasurmentsRepository";
import { IUserMuscleMeasurements } from "../interfaces/IMuscleMeasurment";

const RESOURCE_NAME = "muscle-measurement";

export class MuscleMeasurementService extends BaseService<
  IUserMuscleMeasurements,
  MuscleMeasurementsRepository
> {
  constructor() {
    super(new MuscleMeasurementsRepository(), RESOURCE_NAME);
  }

  async saveMeasurment(userId: string, date: string, measurement: number, muscle: string) {
    try {
      const muscleMeasurement = await this.repository.saveMeasurment(
        userId,
        date,
        measurement,
        muscle
      );

      this.cache.invalidateAllContaining(userId);

      return muscleMeasurement;
    } catch (error) {
      throw error;
    }
  }

  async getUsersMuscleMeasurements(userId: string) {
    const cached = this.cache.get(userId);

    if (cached) return cached;

    try {
      const measurementRecord: IUserMuscleMeasurements = await this.repository.findOne({
        query: { userId },
      });

      this.cache.set(userId, measurementRecord);

      return measurementRecord;
    } catch (err: any) {
      throw err;
    }
  }

  async removeMeasurement(userId: string, date: string, muscle: string) {
    try {
      const deletedProgressNote = this.repository.removeMeasurement(userId, date, muscle);

      this.cache.invalidateAllContaining(userId);

      return deletedProgressNote;
    } catch (error) {
      throw error;
    }
  }
}
