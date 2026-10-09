import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI || process.env.DB_URI || process.env.MONGO_URI;
    if (!uri) {
      console.log('MONGODB_URI/DB_URI not found. Starting in-memory MongoDB Server for local development...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        uri = mongoServer.getUri();
      // eslint-disable-next-line
      } catch (e) {
        console.warn('Failed to start mongodb-memory-server. Ensure it is installed for local dev without a real DB.');
        return;
      }
    }
    
    // Check if already connected (useful in serverless environments)
    if (mongoose.connection.readyState >= 1) {
      return;
    }

    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4 to avoid Vercel Node 18+ DNS fallback issues
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // Do not exit process in serverless env, just throw error
  }
};

export default connectDB;

