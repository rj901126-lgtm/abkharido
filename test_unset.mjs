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

const TestUser = mongoose.model('TestUserUnset', schema);

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/abkharido');
  await TestUser.collection.drop().catch(()=>console.log('no coll'));
  
  const u1 = new TestUser({ email: '' });
  await u1.save();
  
  // Add hook dynamically
  schema.pre('save', function() {
    if (this.email === '' || this.email === undefined) {
      this.$unset('email'); // Try $unset instead of setting to undefined
    }
    if (this.phone === '' || this.phone === undefined) {
      this.$unset('phone');
    }
  });

  const loadedUser = await TestUser.findById(u1._id);
  loadedUser.phone = '123456';
  await loadedUser.save();
  
  const docs = await mongoose.connection.db.collection('testuserunsets').find().toArray();
  console.log('Docs after $unset:', docs);

  process.exit(0);
}
run();
