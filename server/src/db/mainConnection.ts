import dotenv from "dotenv";
import { GridFSBucket } from "mongodb";
import mongoose from "mongoose";
import path from "path";
import { scheduleUserChecks } from "../utils/utils";

const pathToEnv = path.resolve(__dirname, "..", "..", ".env.local");
dotenv.config({ path: pathToEnv });

const GridFS = mongoose.mongo.GridFSBucket;
let gridFSBucket: any;

async function main() {
  const username = process.env.DB_USERNAME;
  const password = process.env.DB_PASSWORD;
  const cluster = process.env.DB_CLUSTER;

  const DATABASE_SERVER = `mongodb+srv://${username}:${password}@${cluster}.syi4d9w.mongodb.net/`;
  const port = process.env.DB_PORT;
  const dbName = process.env.DB_NAME;

  try {
    mongoose.set("strictQuery", false);

    await mongoose.connect(DATABASE_SERVER, { dbName: dbName });
    console.log("MongoDB connected");

    const conn = mongoose.connection;

    gridFSBucket = new GridFS(conn.db, {
      bucketName: "weighIns",
    });

    console.log("GridFS initialized");

    if (port) {
      console.log("Listening on port:", port);
    }

    scheduleUserChecks();
  } catch (err) {
    throw err;
  }
}

main().catch((err) => {
  console.error(err);
  console.log(
    "Failed to connect to MongoDB. Please make sure env.local file contains credentials."
  );
});

export { gridFSBucket };
