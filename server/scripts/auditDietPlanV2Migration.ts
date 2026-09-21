import mongoose, { Connection } from "mongoose";
import connectToDB from "../src/db/connect";
import { DIET_PLANS_COLLECTION } from "../src/models/dietPlanModel";
import { DIET_PLAN_PRESETS_COLLECTION } from "../src/models/dietPlanPresetModel";

export interface DietPlanV2MigrationAuditReport {
  safeToMigrate: boolean;
  collections: {
    dietPlans: string;
    dietPlanPresets: string;
  };
  duplicatePlanUsers: Array<{
    userId: string;
    count: number;
    ids: string[];
  }>;
  incompatiblePresetIndexes: Array<{
    name: string;
    key: Record<string, number>;
    unique: boolean;
  }>;
  presetsNeedingBackfill: Array<{
    id: string;
    name: string;
    missing: Array<"version" | "normalizedName">;
  }>;
}

const listIndexesSafely = async (connection: Connection) => {
  try {
    return await connection.collection(DIET_PLAN_PRESETS_COLLECTION).listIndexes().toArray();
  } catch (error: any) {
    if (error?.code === 26 || error?.codeName === "NamespaceNotFound") return [];
    throw error;
  }
};

export const auditDietPlanV2Migration = async (
  connection: Connection
): Promise<DietPlanV2MigrationAuditReport> => {
  const plans = connection.collection(DIET_PLANS_COLLECTION);
  const presets = connection.collection(DIET_PLAN_PRESETS_COLLECTION);
  const duplicateRows = await plans
    .aggregate<{ _id: string; count: number; ids: mongoose.Types.ObjectId[] }>([
      { $match: { userId: { $type: "string" } } },
      { $group: { _id: "$userId", count: { $sum: 1 }, ids: { $push: "$_id" } } },
      { $match: { count: { $gt: 1 } } },
      { $sort: { _id: 1 } },
    ])
    .toArray();
  const indexes = await listIndexesSafely(connection);
  const incompatiblePresetIndexes = indexes
    .filter(
      (index) =>
        index.unique === true &&
        Object.keys(index.key).length === 1 &&
        index.key.name === 1
    )
    .map((index) => ({
      name: index.name ?? "unnamed",
      key: index.key as Record<string, number>,
      unique: true,
    }));
  const incompletePresets = await presets
    .find({
      $or: [
        { version: { $nin: [1, 2] } },
        { normalizedName: { $not: { $type: "string" } } },
        { normalizedName: "" },
      ],
    })
    .sort({ _id: 1 })
    .toArray();
  const presetsNeedingBackfill = incompletePresets.map((preset) => {
    const missing: Array<"version" | "normalizedName"> = [];

    if (preset.version !== 1 && preset.version !== 2) missing.push("version");
    if (typeof preset.normalizedName !== "string" || preset.normalizedName.trim() === "") {
      missing.push("normalizedName");
    }

    return {
      id: preset._id.toString(),
      name: typeof preset.name === "string" ? preset.name : "",
      missing,
    };
  });
  const duplicatePlanUsers = duplicateRows.map((row) => ({
    userId: row._id,
    count: row.count,
    ids: row.ids.map(String),
  }));

  return {
    safeToMigrate:
      duplicatePlanUsers.length === 0 &&
      incompatiblePresetIndexes.length === 0 &&
      presetsNeedingBackfill.length === 0,
    collections: {
      dietPlans: plans.collectionName,
      dietPlanPresets: presets.collectionName,
    },
    duplicatePlanUsers,
    incompatiblePresetIndexes,
    presetsNeedingBackfill,
  };
};

const runCli = async () => {
  const dbName = process.env.DB_NAME_PROD;

  if (!dbName) throw new Error("DB_NAME_PROD is undefined");

  await connectToDB(dbName);
  const report = await auditDietPlanV2Migration(mongoose.connection);

  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.safeToMigrate ? 0 : 1;
  await mongoose.disconnect();
};

if (require.main === module) {
  runCli().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
