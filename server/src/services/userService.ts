import { IUser } from "../interfaces/IUser";
import { isSystemLibraryOwnerId } from "../config/systemLibrary";
import { StatusCode } from "../enums/StatusCode";
import { ITrainer } from "../interfaces/ITrainer";
import TrainerRepository from "../repositories/Trainer/TrainerRepository";
import { deleteUserDataFromAllCollections } from "../utils/utils";
import { getAuthContext, requireTrainerAuthContext } from "../utils/authContext";
import { BaseService } from "./baseService";
import UserRepository, { GlobalUserRepository } from "../repositories/User/UserRepository";
import PasswordsService from "./PasswordsService";
import { EmailService } from "./EmailService";
import { welcomeEmailTemplate } from "../utils/emailTemplates";

export default class UserService extends BaseService<IUser, UserRepository> {
  private trainerRepository: TrainerRepository;
  private globalUserRepository: GlobalUserRepository;

  constructor() {
    super(new UserRepository(), "users");
    this.trainerRepository = new TrainerRepository();
    this.globalUserRepository = new GlobalUserRepository();
  }

  private shouldCreateUnscoped(userToCreate: Partial<IUser>) {
    return Boolean(userToCreate.trainerId);
  }

  private async enforceTrainerTraineeLimit(userToCreate: Partial<IUser>) {
    const authContext = getAuthContext();
    const targetRole = userToCreate.role || "user";

    if (authContext?.role !== "trainer" || targetRole !== "user") {
      return;
    }

    const { trainerId } = requireTrainerAuthContext();
    const trainer = (await this.trainerRepository.findById(trainerId)) as any as ITrainer | null;

    if (!trainer) {
      throw {
        statusCode: StatusCode.NOT_FOUND,
        message: "Trainer not found.",
      };
    }

    const currentTraineeCount = await this.countDocuments({ role: "user" });

    if (currentTraineeCount >= trainer.clientLimit) {
      throw {
        statusCode: StatusCode.FORBIDDEN,
        message: "Trainer trainee limit reached.",
      };
    }
  }

  createUserWithWelcome = async (
    userToCreate: Partial<IUser>,
    options?: { initialPassword?: string }
  ) => {
    await this.enforceTrainerTraineeLimit(userToCreate);
    const user = this.shouldCreateUnscoped(userToCreate)
      ? await this.createWithoutScope(userToCreate as IUser)
      : await this.create(userToCreate as IUser);

    try {
      const initialPassword =
        options?.initialPassword || (user.phone ? user.phone.replace(/\D/g, "") : undefined);

      if (!initialPassword) {
        throw new Error("Initial password is required when user phone is not provided.");
      }

      await new PasswordsService().hashPassword(user._id.toString(), initialPassword);

      const mailOptions = {
        to: user.email,
        ...welcomeEmailTemplate(initialPassword),
      };

      await new EmailService().sendEmail(mailOptions);
    } catch (error) {
      await new PasswordsService()
        .deletePasswordByUserId(user._id.toString())
        .catch(() => undefined);
      await this.hardDeleteById(user._id.toString()).catch(() => undefined);
      throw error;
    }

    return user;
  };

  findOneUnscoped = async (filter: Partial<Record<keyof IUser, any>>): Promise<IUser | null> => {
    return (await this.globalUserRepository.findOne({ query: filter })) as any as IUser | null;
  };

  async deleteById(id: string) {
    if (isSystemLibraryOwnerId(id)) {
      throw {
        status: StatusCode.FORBIDDEN,
        message: "Cannot delete system admin user.",
      };
    }

    return await super.deleteById(id);
  }

  deleteUser = async (id: string) => {
    try {
      const user = await this.deleteById(id);

      if (user) {
        this.cache.invalidateAll();
        await deleteUserDataFromAllCollections(id);
      }

      return user;
    } catch (error) {
      throw error;
    }
  };

  updateUserField = async (id: string, fieldName: string, fieldValue: string) => {
    try {
      const user = await this.updateById(id, { [fieldName]: fieldValue });

      if (user) this.cache.invalidateAll();

      return user;
    } catch (error) {
      throw error;
    }
  };
}
