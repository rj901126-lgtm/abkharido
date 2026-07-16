import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found in env');
    return;
  }
  console.log('Connecting to database...');
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const doc = await db.collection('promotions').findOne({ _id: 'global_promotions' });
    console.log('DB promotions document:');
    console.log(JSON.stringify(doc, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}
main();
