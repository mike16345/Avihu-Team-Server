import { BaseRepository } from "../BaseRepository";
import { StatusCode } from "../../enums/StatusCode";
import { DELETE_FAILURE } from "../../constants/repository";
import { IUserMuscleMeasurements } from "../../interfaces/IMuscleMeasurment";
import { MuscleMeasurements } from "../../models/muscleMeasurementModel";

export class MuscleMeasurementsRepository extends BaseRepository<IUserMuscleMeasurements> {
  constructor() {
    super(MuscleMeasurements, { type: "global" });
  }

  async saveMeasurment(userId: string, date: string, measurement: number, muscle: string) {
    // Try to update existing date entry
    let measurmentDoc = await this.model.findOneAndUpdate(
      { userId, "measurements.date": date },
      {
        $set: {
          [`measurements.$.${muscle}`]: measurement,
        },
      },
      { new: true }
    );

    // If no entry with this date was found, push a new one
    if (!measurmentDoc) {
      measurmentDoc = await this.model.findOneAndUpdate(
        { userId },
        {
          $push: {
            measurements: {
              date,
              [muscle]: measurement,
            },
          },
        },
        { new: true, upsert: true }
      );
    }

    return measurmentDoc;
  }

  removeMeasurementRowById = async (id: string) => {
    const result = await this.model.findOneAndUpdate(
      { "measurements._id": id },
      {
        $pull: { measurements: { _id: id } },
      },
      { new: true }
    );

    return result;
  };

  removeMeasurement = async (userId: string, date: string, muscle: string) => {
    const result = await this.model.findOneAndUpdate(
      { userId, "measurements.date": date },
      {
        $unset: { [`measurements.$.${muscle}`]: "" },
      },
      { new: true }
    );

    if (!result) throw { status: StatusCode.NOT_FOUND, message: DELETE_FAILURE };

    return result;
  };
}
