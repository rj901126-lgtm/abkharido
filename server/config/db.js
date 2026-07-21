import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;
    if (!uri) {
      console.log('MONGODB_URI not found. Starting in-memory MongoDB Server for local development...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        uri = mongoServer.getUri();
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
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Auto-seed if empty and using memory server
    if (!process.env.MONGODB_URI) {
      await seedDatabaseIfEmpty();
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // Do not exit process in serverless env, just throw error
  }
};

const seedDatabaseIfEmpty = async () => {
  try {
    const { default: Product } = await import('../models/Product.js');
    const { default: User } = await import('../models/User.js');
    
    const count = await Product.countDocuments();
    if (count === 0) {
      console.log('Local MongoDB is empty. Seeding from old JSON files...');
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      
      const productsPath = path.join(__dirname, '..', '..', 'api', 'data', 'products.json');
      if (fs.existsSync(productsPath)) {
        const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
        const docs = productsData.map(p => ({
           ...p,
           originalPrice: p.originalPrice || p.price + 500,
           inStock: p.inStock !== undefined ? p.inStock : true,
           soldCount: p.soldCount || 0
        }));
        await Product.insertMany(docs);
        console.log(`Seeded ${docs.length} products.`);
      }
      
      const adminExists = await User.findOne({ role: 'admin' });
      if (!adminExists) {
          await User.create({
              username: 'admin',
              email: 'admin@abkharido.com',
              password: 'admin',
              role: 'admin',
              fullName: 'System Administrator'
          });
          console.log('Seeded Admin user.');
      }
    }
  } catch (e) {
    console.error('Failed to auto-seed local database:', e);
  }
};

export default connectDB;
