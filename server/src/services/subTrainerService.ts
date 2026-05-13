import { ISubTrainer } from "../interfaces/ISubTrainer";
import { ITrainer } from "../interfaces/ITrainer";
import { IUser } from "../interfaces/IUser";
import { StatusCode } from "../enums/StatusCode";
import SubTrainerRepository from "../repositories/SubTrainer/SubTrainerRepository";
import { getAuthContext, requireTrainerAuthContext } from "../utils/authContext";
import { BaseService } from "./baseService";
import UserService from "./userService";
import { User } from "../models/userModel";
import { SubTrainerModel } from "../models/subTrainerModel";
import { PaginationParams, PaginationResult } from "../utils/pagination";
import TrainerRepository from "../repositories/Trainer/TrainerRepository";

type SubTrainerOverview = {
  trainees: {
    current: number;
  };
};

type SubTrainerWithOverview = {
  subTrainer: ISubTrainer;
  overview: SubTrainerOverview;
};

type CreateSubTrainerPayload = Partial<ISubTrainer> & {
  password: string;
};

const splitFullName = (fullName: string) => {
  const [firstName = "", ...rest] = fullName.trim().split(/\s+/);
  const lastName = rest.join(" ") || firstName;

  return { firstName, lastName };
};

const statusToAccess = (status: ISubTrainer["status"]) => status === "active";

export default class SubTrainerService extends BaseService<ISubTrainer, SubTrainerRepository> {
  private userService: UserService;
  private trainerRepository: TrainerRepository;

  constructor() {
    super(new SubTrainerRepository(), "sub-trainers");
    this.userService = new UserService();
    this.trainerRepository = new TrainerRepository();
  }

  private shouldCreateUnscoped(payload: Partial<ISubTrainer>) {
    const authContext = getAuthContext();

    return authContext?.role === "admin" && Boolean(payload.trainerId);
  }

  private async enforceTrainerSubTrainerLimit() {
    const authContext = getAuthContext();

    if (authContext?.role !== "trainer") {
      return;
    }

    const { trainerId } = requireTrainerAuthContext();
    const trainer = (await this.trainerRepository.findById(trainerId)) as ITrainer | null;

    if (!trainer) {
      throw {
        statusCode: StatusCode.NOT_FOUND,
        message: "Trainer not found.",
      };
    }

    const currentSubTrainerCount = await this.countDocuments();

    if (currentSubTrainerCount >= trainer.subTrainerLimit) {
      throw {
        statusCode: StatusCode.FORBIDDEN,
        message: "Trainer sub trainer limit reached.",
      };
    }
  }

  private buildSubTrainerUserUpdate(payload: Partial<ISubTrainer>): Partial<IUser> {
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

    if (payload.trainerId) {
      userUpdate.trainerId = payload.trainerId;
    }

    return userUpdate;
  }

  private async findLinkedSubTrainerUser(subTrainer: ISubTrainer) {
    if (subTrainer.userId) {
      return { _id: subTrainer.userId };
    }

    try {
      return await this.userService.findOne({
        subTrainerId: subTrainer._id,
        role: "subTrainer",
      });
    } catch {
      return null;
    }
  }

  async createSubTrainer(payload: CreateSubTrainerPayload): Promise<ISubTrainer> {
    await this.enforceTrainerSubTrainerLimit();
    const { password, ...subTrainerPayload } = payload;

    const subTrainer = this.shouldCreateUnscoped(subTrainerPayload)
      ? await this.createWithoutScope(subTrainerPayload as ISubTrainer)
      : await this.create(subTrainerPayload as ISubTrainer);

    try {
      const { firstName, lastName } = splitFullName(subTrainer.fullName);
      const user = await this.userService.createUserWithWelcome(
        {
          firstName,
          lastName,
          email: subTrainer.email,
          phone: subTrainer.phone,
          role: "subTrainer",
          trainerId: subTrainer.trainerId,
          subTrainerId: subTrainer._id,
          hasAccess: statusToAccess(subTrainer.status),
          onboardingStep: "completed",
        },
        { initialPassword: password }
      );

      const updatedSubTrainer = await this.updateById(subTrainer._id.toString(), {
        userId: user._id,
      });

      return updatedSubTrainer as ISubTrainer;
    } catch (error) {
      await SubTrainerModel.findByIdAndDelete(subTrainer._id).catch(() => undefined);
      throw error;
    }
  }

  async getSubTrainerWithOverview(id: string): Promise<SubTrainerWithOverview> {
    const subTrainer = (await this.findById(id)) as ISubTrainer;
    const traineeCount = await User.countDocuments({
      isDeleted: false,
      role: "user",
      trainerId: subTrainer.trainerId,
      subTrainerId: subTrainer._id,
    });

    return {
      subTrainer,
      overview: {
        trainees: {
          current: traineeCount,
        },
      },
    };
  }

  async findPaginatedWithTraineeCounts(
    params: PaginationParams
  ): Promise<PaginationResult<ISubTrainer>> {
    const authContext = getAuthContext();
    const shouldBypassScopeForAdmin =
      authContext?.role === "admin" && Boolean(params.query?.trainerId);

    const paginated = shouldBypassScopeForAdmin
      ? await this.findPaginatedWithoutScope(params)
      : await this.findPaginated(params);
    const results = await Promise.all(
      paginated.results.map(async (subTrainer) => {
        const traineeCount = await User.countDocuments({
          isDeleted: false,
          role: "user",
          subTrainerId: subTrainer._id,
        });

        const subTrainerObject =
          typeof (subTrainer as any)?.toObject === "function"
            ? (subTrainer as any).toObject()
            : subTrainer;

        return {
          ...subTrainerObject,
          traineeCount,
        } as ISubTrainer;
      })
    );

    return {
      ...paginated,
      results,
    };
  }

  async updateSubTrainer(id: string, payload: Partial<ISubTrainer>): Promise<ISubTrainer | null> {
    const subTrainer = (await this.findById(id)) as ISubTrainer;
    const updatedSubTrainer = await this.updateById(id, payload);
    const userUpdate = this.buildSubTrainerUserUpdate(payload);

    if (Object.keys(userUpdate).length > 0) {
      const linkedUser = await this.findLinkedSubTrainerUser(subTrainer);

      if (linkedUser?._id) {
        await this.userService.updateById(linkedUser._id.toString(), userUpdate);
      }
    }

    return updatedSubTrainer;
  }

  async deleteSubTrainer(id: string): Promise<ISubTrainer | null> {
    const subTrainer = (await this.findById(id)) as ISubTrainer;
    const deletedSubTrainer = await this.updateById(id, {
      isDeleted: true,
    } as Partial<ISubTrainer>);

    const linkedUser = await this.findLinkedSubTrainerUser(subTrainer);

    if (linkedUser?._id) {
      await this.userService.updateById(linkedUser._id.toString(), {
        isDeleted: true,
        hasAccess: false,
      });
    }

    return deletedSubTrainer;
  }
}
