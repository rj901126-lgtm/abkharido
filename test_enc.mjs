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

const TestUser = mongoose.model('TestUserEnc', schema);

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/abkharido');
  await TestUser.collection.drop().catch(()=>console.log('no coll'));
  
  // Create a user with ""
  const u1 = new TestUser({ email: '' });
  await u1.save();
  console.log('u1 saved initially');
  
  // Now load the user and change email to undefined
  const loadedUser = await TestUser.findById(u1._id);
  console.log('loadedUser.email:', loadedUser.email);
  loadedUser.email = undefined;
  await loadedUser.save();
  
  console.log('u1 saved after setting undefined. DB raw:');
  const docs2 = await mongoose.connection.db.collection('testuserencs').find().toArray();
  console.log(docs2);

  process.exit(0);
}
run();
