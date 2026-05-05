import { ITrainer } from "../interfaces/ITrainer";
import { IUser } from "../interfaces/IUser";
import { TrainerModel } from "../models/trainerModel";
import { User } from "../models/userModel";
import TrainerRepository from "../repositories/Trainer/TrainerRepository";
import { BaseService } from "./BaseService";
import UserService from "./userService";

type TrainerOverview = {
  subscriptionPlan: ITrainer["subscriptionPlan"];
  trainees: {
    current: number;
    limit: number;
    percentage: number;
  };
  subTrainers: {
    current: number;
    limit: number;
    percentage: number;
  };
};

type TrainerQuickAction = {
  id: "editTrainer" | "toggleTrainerStatus" | "viewSubTrainers";
  label: string;
  enabled: boolean;
  variant: "primary" | "danger" | "secondary";
  meta?: Record<string, any>;
};

type TrainerHeader = {
  fullName: string;
  initials: string;
  joinedAt: Date | null;
};

type TrainerSummary = {
  subscriptionPlan: ITrainer["subscriptionPlan"];
  clientLimit: number;
  subTrainerLimit: number;
  trainees: {
    current: number;
    usageLabel: string;
    percentage: number;
  };
  subTrainers: {
    current: number;
    usageLabel: string;
    percentage: number;
  };
};

type TrainerDashboardDetails = {
  status: ITrainer["status"];
  subscriptionPlan: ITrainer["subscriptionPlan"];
  clientUsage: string;
  subTrainerUsage: string;
  email: string;
  phone: string;
  source: ITrainer["source"];
  joinedAt: Date | null;
  endDate: Date | null;
  videoLibraryAccess: boolean;
};

type TrainerEditForm = Pick<
  ITrainer,
  | "fullName"
  | "email"
  | "phone"
  | "subscriptionPlan"
  | "clientLimit"
  | "subTrainerLimit"
  | "status"
  | "videoLibraryAccess"
>;

type TrainerWithOverview = {
  trainer: ITrainer;
  overview: TrainerOverview;
};

type TrainerGetOnePayload = TrainerWithOverview & {
  header: TrainerHeader;
  summary: TrainerSummary;
  details: TrainerDashboardDetails;
  quickActions: TrainerQuickAction[];
  edit: {
    form: TrainerEditForm;
    summary: TrainerSummary;
  };
};

const splitFullName = (fullName: string) => {
  const [firstName = "", ...rest] = fullName.trim().split(/\s+/);
  const lastName = rest.join(" ") || firstName;

  return { firstName, lastName };
};

const statusToAccess = (status: ITrainer["status"]) => status === "active";

const calculatePercentage = (current: number, limit: number) => {
  if (limit <= 0) return 0;

  return Math.round((current / limit) * 100);
};

const buildUsageLabel = (current: number, limit: number) => `${current}/${limit}`;

const buildInitials = (fullName: string) => {
  const [firstName = "", secondName = ""] = fullName.trim().split(/\s+/);
  return `${firstName[0] || ""}${secondName[0] || ""}`.toUpperCase();
};

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
      const user = await this.userService.createUserWithWelcome(this.buildTrainerUserPayload(trainer));
      const updatedTrainer = await this.updateById(trainer._id.toString(), { userId: user._id });

      return updatedTrainer as ITrainer;
    } catch (error) {
      await TrainerModel.findByIdAndDelete(trainer._id).catch(() => undefined);
      throw error;
    }
  }

  async getTrainerWithOverview(id: string): Promise<TrainerGetOnePayload> {
    const trainer = (await this.findById(id)) as ITrainer;
    const linkedUser = await this.findLinkedTrainerUser(trainer);

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
      subscriptionPlan: trainer.subscriptionPlan,
      trainees: {
        current: traineeCount,
        limit: trainer.clientLimit,
        percentage: calculatePercentage(traineeCount, trainer.clientLimit),
      },
      subTrainers: {
        current: subTrainerCount,
        limit: trainer.subTrainerLimit,
        percentage: calculatePercentage(subTrainerCount, trainer.subTrainerLimit),
      },
    };

    const summary: TrainerSummary = {
      subscriptionPlan: trainer.subscriptionPlan,
      clientLimit: trainer.clientLimit,
      subTrainerLimit: trainer.subTrainerLimit,
      trainees: {
        current: traineeCount,
        usageLabel: buildUsageLabel(traineeCount, trainer.clientLimit),
        percentage: overview.trainees.percentage,
      },
      subTrainers: {
        current: subTrainerCount,
        usageLabel: buildUsageLabel(subTrainerCount, trainer.subTrainerLimit),
        percentage: overview.subTrainers.percentage,
      },
    };

    const header: TrainerHeader = {
      fullName: trainer.fullName,
      initials: buildInitials(trainer.fullName),
      joinedAt: (linkedUser as IUser | null)?.dateJoined || trainer.createdAt || null,
    };

    const details: TrainerDashboardDetails = {
      status: trainer.status,
      subscriptionPlan: trainer.subscriptionPlan,
      clientUsage: summary.trainees.usageLabel,
      subTrainerUsage: summary.subTrainers.usageLabel,
      email: trainer.email,
      phone: trainer.phone,
      source: trainer.source,
      joinedAt: header.joinedAt,
      endDate: (linkedUser as IUser | null)?.dateFinished || null,
      videoLibraryAccess: trainer.videoLibraryAccess,
    };

    const quickActions: TrainerQuickAction[] = [
      {
        id: "editTrainer",
        label: "ערוך מאמן",
        enabled: true,
        variant: "primary",
      },
      {
        id: "toggleTrainerStatus",
        label: trainer.status === "blocked" ? "שחרר חסימה" : "חסום מאמן",
        enabled: true,
        variant: "danger",
        meta: {
          currentStatus: trainer.status,
          nextStatus: trainer.status === "blocked" ? "active" : "blocked",
        },
      },
      {
        id: "viewSubTrainers",
        label: "צפה בתת-מאמנים",
        enabled: subTrainerCount > 0,
        variant: "secondary",
        meta: {
          count: subTrainerCount,
        },
      },
    ];

    const edit: TrainerGetOnePayload["edit"] = {
      form: {
        fullName: trainer.fullName,
        email: trainer.email,
        phone: trainer.phone,
        subscriptionPlan: trainer.subscriptionPlan,
        clientLimit: trainer.clientLimit,
        subTrainerLimit: trainer.subTrainerLimit,
        status: trainer.status,
        videoLibraryAccess: trainer.videoLibraryAccess,
      },
      summary,
    };

    return { trainer, overview, header, summary, details, quickActions, edit };
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
