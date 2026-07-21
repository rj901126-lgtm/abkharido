import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './server/config/db.js';
import Product from './server/models/Product.js';
import User from './server/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrate = async () => {
  await connectDB();
  
  try {
    const productsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'api', 'data', 'products.json'), 'utf-8'));
    
    // Clear existing to avoid duplicates if run multiple times
    await Product.deleteMany({});
    
    const docs = productsData.map(p => {
       // Convert string _id to ObjectId is handled by mongoose if valid, but we might just let mongoose generate new _ids or keep old string ID in 'id' field
       return {
         ...p,
         originalPrice: p.originalPrice || p.price + 500, // mock original price
         inStock: p.inStock !== undefined ? p.inStock : true,
         soldCount: p.soldCount || 0
       };
    });
    
    await Product.insertMany(docs);
    console.log(`Migrated ${docs.length} products to MongoDB successfully.`);
    
    // Check if admin user exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
        await User.create({
            username: 'admin',
            email: 'admin@abkharido.com',
            password: 'admin',
            role: 'admin',
            fullName: 'System Administrator'
        });
        console.log('Admin user created (admin/admin)');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
