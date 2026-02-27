const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

const shouldUseInMemoryMongo = process.env.SKIP_MONGO_MEMORY_SERVER !== "true";

beforeAll(async () => {
  if (!shouldUseInMemoryMongo) {
    return;
  }

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  if (!shouldUseInMemoryMongo) {
    return;
  }

  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  if (!shouldUseInMemoryMongo) {
    return;
  }

  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});
