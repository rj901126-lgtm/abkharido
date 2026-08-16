import mongoose from 'mongoose';

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
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const tryConnect = async (targetUri) => {
      return mongoose.connect(targetUri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 2000,
      }).then(async (mongooseInstance) => {
        try {
          const { seedDatabaseIfEmpty } = await import('../../server/utils/seed.js');
          await seedDatabaseIfEmpty();
        } catch (_) {}
        return mongooseInstance;
      });
    };

    cached.promise = (async () => {
      const uri = process.env.MONGODB_URI;
      if (uri) {
        try {
          return await tryConnect(uri);
        } catch (err) {
          console.warn(`[connectDB] Configured URI ${uri} unreachable (${err.message}). Falling back to MongoMemoryServer...`);
        }
      }
      const inMemUri = await getInMemoryUri();
      return await tryConnect(inMemUri);
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
