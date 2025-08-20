import { APIGatewayProxyEvent } from "aws-lambda";

export function getDbName(event: APIGatewayProxyEvent): string {
  return process.env.DB_NAME_PROD!;

  const alias = event?.stageVariables?.lambdaAlias || "prod";

  switch (alias) {
    case "prod":
      return process.env.DB_NAME_PROD!;
    case "dev":
      return process.env.DB_NAME_DEV!;
    default:
      throw new Error(`Unknown stage: ${alias}. Cannot determine DB name.`);
  }
}
