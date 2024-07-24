import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";

const pathToEnv = path.resolve(__dirname, "..", "..", ".env.local");
dotenv.config({ path: pathToEnv });

main().catch((err) => {
  console.error(err);
  console.log(
    "Failed to connect to MongoDB. Please make sure env.local file contains credentials."
  );
});

async function main() {
  const username = process.env.DB_USERNAME;
  const password = process.env.DB_PASSWORD;
  const cluster = process.env.DB_CLUSTER;
  const DATABASE_SERVER = `mongodb+srv://${username}:${password}@${cluster}.syi4d9w.mongodb.net/`;
  const port = process.env.DB_PORT;
  const dbName = process.env.DB_NAME;
  console.log("database server:", DATABASE_SERVER);

  try {
    mongoose.set("strictQuery", false);

    await mongoose.connect(DATABASE_SERVER, { dbName: dbName });
    console.log("mongo connected listening on port:", port);
  } catch (err) {
    throw err;
  }
}
