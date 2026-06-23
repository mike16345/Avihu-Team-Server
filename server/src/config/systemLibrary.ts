import mongoose from "mongoose";

const SYSTEM_LIBRARY_OWNER_ENV_KEY = "AVIHU_TRAINER_ID";

const readSystemLibraryOwnerId = (): string => {
  const trainerId = process.env[SYSTEM_LIBRARY_OWNER_ENV_KEY]?.trim();

  if (!trainerId) {
    throw new Error(`Missing required ${SYSTEM_LIBRARY_OWNER_ENV_KEY} environment variable.`);
  }

  if (!mongoose.Types.ObjectId.isValid(trainerId)) {
    throw new Error(`Invalid ${SYSTEM_LIBRARY_OWNER_ENV_KEY} environment variable.`);
  }

  return new mongoose.Types.ObjectId(trainerId).toString();
};

const SYSTEM_LIBRARY_OWNER_ID = readSystemLibraryOwnerId();

export const getSystemLibraryOwnerId = (): string => SYSTEM_LIBRARY_OWNER_ID;

export const getSystemLibraryOwnerObjectId = (): mongoose.Types.ObjectId =>
  new mongoose.Types.ObjectId(SYSTEM_LIBRARY_OWNER_ID);

export const isSystemLibraryOwnerId = (id?: string | mongoose.Types.ObjectId | null): boolean => {
  if (!id) return false;

  if (!mongoose.Types.ObjectId.isValid(id)) return false;

  return new mongoose.Types.ObjectId(id).toString() === SYSTEM_LIBRARY_OWNER_ID;
};

export const isSystemLibraryOwner = isSystemLibraryOwnerId;
export const isAvihuTrainer = isSystemLibraryOwner;
