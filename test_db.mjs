import mongoose from 'mongoose';
import mongooseFieldEncryption from 'mongoose-field-encryption';

const schema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true }
});

schema.pre('save', function() {
  if (this.email === '') this.email = undefined;
  if (this.phone === '') this.phone = undefined;
});

schema.plugin(mongooseFieldEncryption.fieldEncryption, {
  fields: ['email', 'phone'],
  secret: 'abkharido_default_master_encryption_key_2026_super_secure',
  saltGenerator: function (secret) {
    return "1234567890123456";
  },
});

const TestUser = mongoose.model('TestUser', schema);

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/abkharido');
  await TestUser.collection.drop().catch(()=>console.log('no coll'));
  
  const u1 = new TestUser({ email: '' });
  await u1.save();
  console.log('u1 saved', u1.toObject());
  
  const u2 = new TestUser({ email: '' });
  try {
    await u2.save();
    console.log('u2 saved', u2.toObject());
  } catch(e) {
    console.error('u2 failed', e.message);
  }

  // see what's actually in db
  const docs = await mongoose.connection.db.collection('testusers').find().toArray();
  console.log('Raw DB docs:', docs);
  
  process.exit(0);
}
run();
