import mongoose from "mongoose";

let conn: Promise<mongoose.Mongoose> | null = null;

const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const cluster = process.env.DB_CLUSTER;

const uri = `mongodb+srv://${username}:${password}@${cluster}.syi4d9w.mongodb.net/;`;

export default async function () {
  try {
    console.log("connecting to database");
    if (conn == null) {
      conn = mongoose
        .connect(uri, {
          serverSelectionTimeoutMS: 5000,
          dbName: dbName,
        })
        .then(() => mongoose);

      await conn;
    }

    console.log("Connected to database!");
    return conn;
  } catch (e) {
    throw e;
  }
}
