import mongoose from 'mongoose';

let MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function getInMemoryUri() {
  if (global.__MONGO_URI__) return global.__MONGO_URI__;
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const mongoServer = await MongoMemoryServer.create();
  global.__MONGO_URI__ = mongoServer.getUri();
  console.log(`[Enterprise Config] Using in-memory MongoDB fallback: ${global.__MONGO_URI__}`);
  return global.__MONGO_URI__;
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    if (!MONGODB_URI) {
      MONGODB_URI = await getInMemoryUri();
    }
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    }).then(async (mongooseInstance) => {
      // Seed data if empty
      const { seedDatabaseIfEmpty } = await import('../../server/utils/seed.js');
      await seedDatabaseIfEmpty();
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
