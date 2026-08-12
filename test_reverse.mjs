import mongoose from 'mongoose';
import mongooseFieldEncryption from 'mongoose-field-encryption';

const schema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
});

schema.plugin(mongooseFieldEncryption.fieldEncryption, {
  fields: ['email'],
  secret: 'abkharido_default_master_encryption_key_2026_super_secure',
  saltGenerator: function (secret) {
    return "1234567890123456";
  },
});

const TestUser = mongoose.model('TestUserReverse', schema);

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/abkharido');
  await TestUser.collection.drop().catch(()=>console.log('no coll'));
  
  const testValues = ["", undefined, null, "null", "undefined", " ", "Customer", "0000000000"];
  
  for (const val of testValues) {
    const u = new TestUser();
    if (val !== undefined) {
      u.email = val;
    } else {
      u.email = undefined; // Set it explicitly just to see if it marks as modified
      u.markModified('email');
    }
    await u.save().catch(e => console.log('save failed for', val, e.message));
  }
  
  const docs = await mongoose.connection.db.collection('testuserreverses').find().toArray();
  for (const doc of docs) {
    console.log('DB entry:', doc.email);
  }
  
  // also let's manually decrypt 8a37a8487d3d353fe
  const User = mongoose.model('User') || mongoose.model('User', new mongoose.Schema({ email: String }).plugin(mongooseFieldEncryption.fieldEncryption, { fields: ['email'], secret: 'abkharido_default_master_encryption_key_2026_super_secure', saltGenerator: () => "1234567890123456" }));
  
  // We can't easily decrypt without the internal logic, but we can search for what generated it
  
  process.exit(0);
}
run();
