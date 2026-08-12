import mongoose from 'mongoose';
import mongooseFieldEncryption from 'mongoose-field-encryption';

const schema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  fullName: String
});

schema.plugin(mongooseFieldEncryption.fieldEncryption, {
  fields: ['email'],
  secret: 'abkharido_default_master_encryption_key_2026_super_secure',
  saltGenerator: function (secret) {
    return "1234567890123456";
  },
});

const TestUser = mongoose.model('TestUserConflict', schema);

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/abkharido');
  await TestUser.collection.drop().catch(()=>console.log('no coll'));
  
  const u1 = new TestUser({ email: '', fullName: 'Old Name' });
  await u1.save();
  
  const user = await TestUser.findById(u1._id);
  
  // Clean DB directly
  await TestUser.collection.updateOne({ _id: user._id }, { $unset: { email: "", __enc_email: "" } });
  
  // Now modify memory object
  user.email = undefined;
  user.fullName = 'New Name'; // trigger save
  
  await user.save(); // Will it re-encrypt undefined?
  
  const docs = await mongoose.connection.db.collection('testuserconflicts').find().toArray();
  console.log('Docs after memory object save:', docs);

  process.exit(0);
}
run();
