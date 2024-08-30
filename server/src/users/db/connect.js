const mongoose = require("mongoose");


let conn = null;

const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD
const dbName = process.env.DB_NAME;
const cluster = process.env.DB_CLUSTER

const uri = `mongodb+srv://${username}:${password}@${cluster}.syi4d9w.mongodb.net/;`
exports.connect = async function () {
  if (conn == null) {
    conn = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 5000,
        dbName : dbName
      })
      .then(() => mongoose);

    await conn;
  }

  return conn;
};
