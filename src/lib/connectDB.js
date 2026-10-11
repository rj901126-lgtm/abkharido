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

/**
 * Enterprise MongoDB Connection Manager
 * Features:
 * - Connection caching across serverless invocations (avoids socket exhaustion)
 * - Connection pooling: maxPoolSize: 10, minPoolSize: 1
 * - 5000ms selection timeout for resilient cold-starts
 * - 45000ms socket timeout to terminate zombie queries
 * - family: 4 to avoid slow IPv6 DNS resolution stalls on Vercel
 */
async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const connectionOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4 to eliminate slow IPv6 DNS resolution in Vercel serverless
    };

    const tryConnect = async (targetUri) => {
      return mongoose.connect(targetUri, connectionOptions);
    };

    cached.promise = (async () => {
      const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DB_URI;
      if (uri) {
        try {
          return await tryConnect(uri);
        } catch (err) {
          console.warn(`[connectDB] Primary MongoDB URI failed (${err.message}).`);
          if (process.env.VERCEL) {
            throw err;
          }
          console.warn(`[connectDB] Falling back to MongoMemoryServer...`);
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
