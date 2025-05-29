import mongoose from "mongoose";

let conn: Promise<mongoose.Mongoose> | null = null;

const dbName = process.env.DB_NAME;
const uri = process.env.MONGO_URI;

export default async function () {
  if (!uri || !dbName) throw new Error("URI or DB name is undefined! Please check env variables.");

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
export { conn };
