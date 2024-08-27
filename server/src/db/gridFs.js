const mongoose = require("mongoose");
const db = require("./connect");
const GridFS = mongoose.mongo.GridFSBucket;

let gridFs = null;

exports.connectGridFs = async () => {
  if (gridFs) return gridFs;

  try {
    await db.connect();
    const conn = mongoose.connection;

    gridFs = new GridFS(conn.db, {
      bucketName: "weighIns",
    });

    return gridFs;
  } catch (e) {
    console.error("Error connecting to GridFS", e);
  }
};
