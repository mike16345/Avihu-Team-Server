import {
  BlockBackgroundStatus,
  IBlockBackground,
  IBlockTipDefault,
  IDietTipGoal,
  ITrainer,
} from "../../interfaces/ITrainer";
import { TrainerModel } from "../../models/trainerModel";
import { BaseRepository } from "../BaseRepository";

export default class TrainerRepository extends BaseRepository<ITrainer> {
  constructor() {
    super(TrainerModel, { type: "global" });
  }

  async getBlockBackgrounds(id: string): Promise<Pick<ITrainer, "blockBackgrounds"> | null> {
    return TrainerModel.findById(id).select("blockBackgrounds").lean() as any;
  }

  async upsertBlockBackground(
    id: string,
    status: BlockBackgroundStatus,
    url: string
  ): Promise<IBlockBackground[]> {
    await TrainerModel.updateOne(
      { _id: id },
      { $pull: { blockBackgrounds: { status } } }
    );
    const updated = await TrainerModel.findByIdAndUpdate(
      id,
      { $push: { blockBackgrounds: { status, url } } },
      { new: true, projection: { blockBackgrounds: 1 } }
    ).lean();
    return (updated?.blockBackgrounds as IBlockBackground[]) ?? [];
  }

  async deleteBlockBackground(
    id: string,
    status: BlockBackgroundStatus
  ): Promise<IBlockBackground[]> {
    const updated = await TrainerModel.findByIdAndUpdate(
      id,
      { $pull: { blockBackgrounds: { status } } },
      { new: true, projection: { blockBackgrounds: 1 } }
    ).lean();
    return (updated?.blockBackgrounds as IBlockBackground[]) ?? [];
  }

  async getBlockTipDefaults(
    id: string
  ): Promise<Pick<ITrainer, "blockTipDefaults"> | null> {
    return TrainerModel.findById(id).select("blockTipDefaults").lean() as any;
  }

  async upsertBlockTipDefault(
    id: string,
    status: BlockBackgroundStatus,
    tips: string[]
  ): Promise<IBlockTipDefault[]> {
    await TrainerModel.updateOne(
      { _id: id },
      { $pull: { blockTipDefaults: { status } } }
    );
    const updated = await TrainerModel.findByIdAndUpdate(
      id,
      { $push: { blockTipDefaults: { status, tips } } },
      { new: true, projection: { blockTipDefaults: 1 } }
    ).lean();
    return (updated?.blockTipDefaults as IBlockTipDefault[]) ?? [];
  }

  async deleteBlockTipDefault(
    id: string,
    status: BlockBackgroundStatus
  ): Promise<IBlockTipDefault[]> {
    const updated = await TrainerModel.findByIdAndUpdate(
      id,
      { $pull: { blockTipDefaults: { status } } },
      { new: true, projection: { blockTipDefaults: 1 } }
    ).lean();
    return (updated?.blockTipDefaults as IBlockTipDefault[]) ?? [];
  }

  async getDietTipGoals(
    id: string
  ): Promise<Pick<ITrainer, "dietTipGoals"> | null> {
    return TrainerModel.findById(id).select("dietTipGoals").lean() as any;
  }

  async upsertDietTipGoal(
    id: string,
    key: string,
    label: string,
    tips: string[]
  ): Promise<IDietTipGoal[]> {
    await TrainerModel.updateOne(
      { _id: id },
      { $pull: { dietTipGoals: { key } } }
    );
    const updated = await TrainerModel.findByIdAndUpdate(
      id,
      { $push: { dietTipGoals: { key, label, tips } } },
      { new: true, projection: { dietTipGoals: 1 } }
    ).lean();
    return (updated?.dietTipGoals as IDietTipGoal[]) ?? [];
  }

  async deleteDietTipGoal(
    id: string,
    key: string
  ): Promise<IDietTipGoal[]> {
    const updated = await TrainerModel.findByIdAndUpdate(
      id,
      { $pull: { dietTipGoals: { key } } },
      { new: true, projection: { dietTipGoals: 1 } }
    ).lean();
    return (updated?.dietTipGoals as IDietTipGoal[]) ?? [];
  }
}
