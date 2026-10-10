import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { connectDb, disconnectDb } from '../src/config/db.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectDb(mongoServer.getUri());
  await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).init()));
});

afterEach(async () => {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})),
  );
});

afterAll(async () => {
  await disconnectDb();
  await mongoServer.stop();
});
