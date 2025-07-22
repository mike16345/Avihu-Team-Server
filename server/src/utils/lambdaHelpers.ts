// src/utils/getDbName.ts
import { APIGatewayProxyEvent } from "aws-lambda";

export function getDbName(event: APIGatewayProxyEvent): string {
  const stage = event?.requestContext?.stage;

  switch (stage) {
    case "prod":
      return process.env.DB_NAME_PROD!;
    case "dev":
      return process.env.DB_NAME_DEV!;
    default:
      throw new Error(`Unknown stage: ${stage}. Cannot determine DB name.`);
  }
}
