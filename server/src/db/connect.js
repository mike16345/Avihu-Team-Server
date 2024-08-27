const mongoose = require("mongoose");

let conn = null;

const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const cluster = process.env.DB_CLUSTER;

const DATABASE_SERVER = `mongodb+srv://${username}:${password}@${cluster}.syi4d9w.mongodb.net/`;
const dbName = process.env.DB_NAME;

exports.connect = async function () {
  if (conn == null) {
    conn = mongoose
      .connect(DATABASE_SERVER, {
        serverSelectionTimeoutMS: 5000,
        dbName: dbName,
      })
      .then(() => mongoose);

    await conn;
  }

  return conn;
};
