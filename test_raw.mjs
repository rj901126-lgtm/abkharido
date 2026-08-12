import mongoose from 'mongoose';
import mongooseFieldEncryption from 'mongoose-field-encryption';

const schema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true }
});

schema.plugin(mongooseFieldEncryption.fieldEncryption, {
  fields: ['email', 'phone'],
  secret: 'abkharido_default_master_encryption_key_2026_super_secure',
  saltGenerator: function (secret) {
    return "1234567890123456";
  },
});

const TestUser = mongoose.model('TestUserRaw', schema);

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/abkharido');
  await TestUser.collection.drop().catch(()=>console.log('no coll'));
  
  const u1 = new TestUser({ email: '' });
  await u1.save();
  
  // Try raw updateOne
  const user = await TestUser.findById(u1._id);
  if (user.email === '') {
    await TestUser.collection.updateOne(
      { _id: user._id },
      { $unset: { email: "", __enc_email: "" } }
    );
  }

  const docs = await mongoose.connection.db.collection('testuserraws').find().toArray();
  console.log('Docs after raw $unset:', docs);

  // Now try to save the user via Mongoose after doing a raw update
  // We need to fetch it fresh so mongoose knows it's gone
  const freshUser = await TestUser.findById(u1._id);
  console.log('Fresh user email:', freshUser.email);
  freshUser.phone = '123456';
  await freshUser.save();
  
  const docs2 = await mongoose.connection.db.collection('testuserraws').find().toArray();
  console.log('Docs after saving fresh user:', docs2);

  process.exit(0);
}
run();
