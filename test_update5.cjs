const mongoose = require('mongoose');
const User = require('./server/models/User.js').default;
const { updateUserProfile } = require('./server/controllers/userController.js');

mongoose.connect('mongodb://127.0.0.1:27017/test').then(async () => {
  try {
    await User.deleteMany({});
    
    // User 1
    const user1 = new User({ username: 'user1', password: 'password123' });
    await user1.save();
    
    // Use raw query to set encrypted empty string for User 1
    await mongoose.connection.db.collection('users').updateOne(
      { _id: user1._id },
      { $set: { email: '31323334353637383930313233343536:13a074a84435a1969cc5f067640cda59', __enc_email: true } }
    );
    
    // User 2
    const user2 = new User({ username: 'user2', password: 'password123' });
    await user2.save();
    
    // Use raw query to set encrypted empty string for User 2
    await mongoose.connection.db.collection('users').updateOne(
      { _id: user2._id },
      { $set: { email: '31323334353637383930313233343536:8a37a8487d3d353fe', __enc_email: true } }
    );
    
    const user2Doc = await User.findOne({ username: 'user2' });
    
    // Attempt to update User 2 WITHOUT passing email
    const req = {
      params: { username: 'user2' },
      user: { _id: user2Doc._id, username: 'user2', role: 'user' },
      body: { 
        firstName: 'Test2'
        // email is omitted, just like Checkout.jsx
      }
    };
    
    const res = {
      status: (s) => console.log('Status set to:', s),
      json: (data) => { console.log('Success!', data._id); process.exit(0); }
    };
    
    const next = (err) => {
      console.error('API threw error:', err.message);
      if (err.message.includes('duplicate key')) {
        console.error('E11000 DETECTED!');
      }
      process.exit(1);
    };
    
    await updateUserProfile(req, res, next);
    
  } catch (e) {
    console.error('FATAL ERROR:', e);
    process.exit(1);
  }
});
