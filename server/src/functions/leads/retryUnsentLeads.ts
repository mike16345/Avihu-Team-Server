import { Context, ScheduledEvent } from "aws-lambda";
import connectToDB from "../../db/connect";
import PublicSignupService from "../../services/PublicSignupService";

const service = new PublicSignupService();

export const handler = async (event: ScheduledEvent, context: Context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const dbName = process.env.DB_NAME_PROD || process.env.DB_NAME_DEV;
  if (!dbName) {
    throw new Error("Database name is not configured");
  }

  await connectToDB(dbName);

  const summary = await service.retryUnsentLeads();

  return summary;
};
