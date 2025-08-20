import mongoose from "mongoose";

let conn: Promise<typeof mongoose> | null = null;

const uri = process.env.MONGO_URI;

export default async function connectToDB(dbName: string) {
  if (!uri) throw new Error("MONGO_URI is undefined");
  if (!dbName) throw new Error("dbName is undefined");
  console.log("Connecting to database...");

  const isAlreadyConnected = conn && mongoose.connection.name === dbName;

  try {
    if (isAlreadyConnected) {
      console.log("Already connected!", mongoose.connection.name);
      return conn;
    }

    if (mongoose.connection.readyState === 1) {
      console.log("Connection was live, disconnecting...");
      await mongoose.disconnect();
    }

    console.log("Creating new connection...");
    conn = mongoose
      .connect(uri, {
        dbName,
        serverSelectionTimeoutMS: 5000,
      })
      .then((mongoose) => mongoose);

    await conn;
    console.log(`Connected to MongoDB: ${dbName}`);

    return conn;
  } catch (error) {
    throw error;
  }
}
