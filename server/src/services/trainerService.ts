import { ITrainer } from "../interfaces/ITrainer";
import { IUser } from "../interfaces/IUser";
import { TrainerModel } from "../models/trainerModel";
import { SubTrainerModel } from "../models/subTrainerModel";
import { User } from "../models/userModel";
import TrainerRepository from "../repositories/Trainer/TrainerRepository";
import { PaginationParams, PaginationResult } from "../utils/pagination";
import { BaseService } from "./baseService";
import ExerciseLibraryAccessService from "./ExerciseLibraryAccessService";
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
  private exerciseLibraryAccessService: ExerciseLibraryAccessService;

  constructor() {
    super(new TrainerRepository(), "trainers");
    this.userService = new UserService();
    this.exerciseLibraryAccessService = new ExerciseLibraryAccessService();
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
      onboardingStep: "completed",
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

  private async attachCountsToTrainers<T extends ITrainer>(trainers: T[]): Promise<T[]> {
    if (trainers.length === 0) {
      return trainers;
    }

    const trainerIds = trainers.map((trainer) => trainer._id);

    const [traineeCounts, subTrainerCounts] = await Promise.all([
      User.aggregate<{ _id: any; count: number }>([
        {
          $match: {
            isDeleted: false,
            role: "user",
            trainerId: { $in: trainerIds },
          },
        },
        {
          $group: {
            _id: "$trainerId",
            count: { $sum: 1 },
          },
        },
      ]),
      SubTrainerModel.aggregate<{ _id: any; count: number }>([
        {
          $match: {
            isDeleted: false,
            trainerId: { $in: trainerIds },
          },
        },
        {
          $group: {
            _id: "$trainerId",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const traineeCountByTrainerId = new Map(
      traineeCounts.map(({ _id, count }) => [_id.toString(), count])
    );
    const subTrainerCountByTrainerId = new Map(
      subTrainerCounts.map(({ _id, count }) => [_id.toString(), count])
    );

    return trainers.map((trainer) => {
      const trainerObject =
        typeof (trainer as any)?.toObject === "function" ? (trainer as any).toObject() : trainer;
      const trainerId = trainer._id.toString();

      return {
        ...trainerObject,
        traineeCount: traineeCountByTrainerId.get(trainerId) || 0,
        subTrainerCount: subTrainerCountByTrainerId.get(trainerId) || 0,
      };
    });
  }

  async findWithCounts(filter: Partial<Record<keyof ITrainer, any>> = {}): Promise<ITrainer[]> {
    const trainers = await this.find(filter);

    return this.attachCountsToTrainers(trainers as ITrainer[]);
  }

  async findPaginatedWithCounts(params: PaginationParams): Promise<PaginationResult<ITrainer>> {
    const paginated = await this.findPaginated(params);
    const results = await this.attachCountsToTrainers(paginated.results as ITrainer[]);

    return {
      ...paginated,
      results,
    };
  }

  async createTrainer(payload: Partial<ITrainer> & { password: string }): Promise<ITrainer> {
    const { password, ...trainerPayload } = payload;
    const trainer = await this.create(trainerPayload as ITrainer);

    try {
      if (trainer.videoLibraryAccess) {
        await this.exerciseLibraryAccessService.copyAvihuLibraryToTrainer(trainer._id.toString());
      }

      const user = await this.userService.createUserWithWelcome(
        this.buildTrainerUserPayload(trainer),
        { initialPassword: password }
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
      SubTrainerModel.countDocuments({
        isDeleted: false,
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
