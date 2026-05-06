import { ITrainer } from "../interfaces/ITrainer";
import { IUser } from "../interfaces/IUser";
import { TrainerModel } from "../models/trainerModel";
import { User } from "../models/userModel";
import TrainerRepository from "../repositories/Trainer/TrainerRepository";
import { BaseService } from "./BaseService";
import UserService from "./userService";

type TrainerOverview = {
  trainees: {
    current: number;
  };
  subTrainers: {
    current: number;
  };
};

type TrainerWithOverview = {
  trainer: ITrainer;
  overview: TrainerOverview;
};

const splitFullName = (fullName: string) => {
  const [firstName = "", ...rest] = fullName.trim().split(/\s+/);
  const lastName = rest.join(" ") || firstName;

  return { firstName, lastName };
};

const statusToAccess = (status: ITrainer["status"]) => status === "active";

export default class TrainerService extends BaseService<ITrainer, TrainerRepository> {
  private userService: UserService;

  constructor() {
    super(new TrainerRepository(), "trainers");
    this.userService = new UserService();
  }

  private buildTrainerUserPayload(trainer: ITrainer): Partial<IUser> {
    const { firstName, lastName } = splitFullName(trainer.fullName);

    return {
      firstName,
      lastName,
      email: trainer.email,
      phone: trainer.phone,
      role: "trainer",
      trainerId: trainer._id,
      hasAccess: statusToAccess(trainer.status),
    };
  }

  private buildTrainerUserUpdate(payload: Partial<ITrainer>): Partial<IUser> {
    const userUpdate: Partial<IUser> = {};

    if (payload.fullName) {
      const { firstName, lastName } = splitFullName(payload.fullName);
      userUpdate.firstName = firstName;
      userUpdate.lastName = lastName;
    }

    if (payload.email) {
      userUpdate.email = payload.email;
    }

    if (payload.phone) {
      userUpdate.phone = payload.phone;
    }

    if (payload.status) {
      userUpdate.hasAccess = statusToAccess(payload.status);
    }

    return userUpdate;
  }

  private async findLinkedTrainerUser(trainer: ITrainer) {
    if (trainer.userId) {
      try {
        return await this.userService.findById(trainer.userId.toString());
      } catch {
        return null;
      }
    }

    try {
      const linkedUser = await this.userService.findOne({
        trainerId: trainer._id,
        role: "trainer",
      });

      return linkedUser;
    } catch {
      return null;
    }
  }

  async createTrainer(payload: Partial<ITrainer>): Promise<ITrainer> {
    const trainer = await this.create(payload as ITrainer);

    try {
      const user = await this.userService.createUserWithWelcome(
        this.buildTrainerUserPayload(trainer)
      );
      const updatedTrainer = await this.updateById(trainer._id.toString(), { userId: user._id });

      return updatedTrainer as ITrainer;
    } catch (error) {
      await TrainerModel.findByIdAndDelete(trainer._id).catch(() => undefined);
      throw error;
    }
  }

  async getTrainerWithOverview(id: string): Promise<TrainerWithOverview> {
    const trainer = (await this.findById(id)) as ITrainer;

    const [traineeCount, subTrainerCount] = await Promise.all([
      User.countDocuments({
        isDeleted: false,
        role: "user",
        trainerId: trainer._id,
      }),
      User.countDocuments({
        isDeleted: false,
        role: "subTrainer",
        trainerId: trainer._id,
      }),
    ]);

    const overview: TrainerOverview = {
      trainees: {
        current: traineeCount,
      },
      subTrainers: {
        current: subTrainerCount,
      },
    };

    return { trainer, overview };
  }

  async updateTrainer(id: string, payload: Partial<ITrainer>): Promise<ITrainer | null> {
    const trainer = (await this.findById(id)) as ITrainer;
    const updatedTrainer = await this.updateById(id, payload);
    const userUpdate = this.buildTrainerUserUpdate(payload);

    if (Object.keys(userUpdate).length > 0) {
      const linkedUser = await this.findLinkedTrainerUser(trainer);

      if (linkedUser?._id) {
        await this.userService.updateById(linkedUser._id.toString(), userUpdate);
      }
    }

    return updatedTrainer;
  }

  async deleteTrainer(id: string): Promise<ITrainer | null> {
    const trainer = (await this.findById(id)) as ITrainer;
    const deletedTrainer = await this.updateById(id, { isDeleted: true } as Partial<ITrainer>);

    const linkedUser = await this.findLinkedTrainerUser(trainer);

    if (linkedUser?._id) {
      await this.userService.updateById(linkedUser._id.toString(), {
        isDeleted: true,
        hasAccess: false,
      });
    }

    return deletedTrainer;
  }
}
