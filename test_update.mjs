import mongoose from 'mongoose';
import mongooseFieldEncryption from 'mongoose-field-encryption';

const schema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true }
});

// simulate the old behavior where we saved empty strings
// we'll comment out the pre-save hook first to save an empty string

schema.plugin(mongooseFieldEncryption.fieldEncryption, {
  fields: ['email', 'phone'],
  secret: 'abkharido_default_master_encryption_key_2026_super_secure',
  saltGenerator: function (secret) {
    return "1234567890123456";
  },
});

const TestUser = mongoose.model('TestUserUpdate', schema);

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/abkharido');
  await TestUser.collection.drop().catch(()=>console.log('no coll'));
  
  // 1. Create a user WITH an empty string (simulating old behavior)
  const u1 = new TestUser({ email: '' });
  await u1.save();
  console.log('u1 saved initially. DB raw:');
  const docs1 = await mongoose.connection.db.collection('testuserupdates').find().toArray();
  console.log(docs1);

  // 2. Add the hook dynamically for the update phase
  schema.pre('save', function() {
    if (this.email === '') this.email = undefined;
    if (this.phone === '') this.phone = undefined;
  });

  // 3. Load the user and save again (simulating updateUserProfile)
  const loadedUser = await TestUser.findById(u1._id);
  console.log('Loaded user email:', loadedUser.email);
  loadedUser.phone = '1234567890'; // modify something else to trigger save
  await loadedUser.save();
  
  console.log('u1 saved after hook. DB raw:');
  const docs2 = await mongoose.connection.db.collection('testuserupdates').find().toArray();
  console.log(docs2);
  
  // 4. Load again and save again to see if it causes E11000 with a second user
  const u2 = new TestUser({ email: '' });
  await u2.save(); // this has empty string again
  
  const loadedUser2 = await TestUser.findById(u2._id);
  loadedUser2.phone = '0987654321';
  try {
    await loadedUser2.save();
    console.log('u2 saved after hook.');
  } catch(e) {
    console.error('u2 failed!', e.message);
  }

  process.exit(0);
}
run();
