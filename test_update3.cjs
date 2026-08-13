const mongoose = require('mongoose');
const User = require('./server/models/User.js').default;
const { updateUserProfile } = require('./server/controllers/userController.js');

mongoose.connect('mongodb://127.0.0.1:27017/test').then(async () => {
  try {
    await User.deleteMany({});
    
    // Create User 1
    const user1 = new User({ username: 'user1', email: '', password: 'password123' });
    await user1.save();
    console.log('User 1 created.');
    
    // Create User 2
    try {
      const user2 = new User({ username: 'user2', email: '', password: 'password123' });
      await user2.save();
      console.log('User 2 created.');
    } catch(e) {
      console.log('User 2 save error:', e.message);
      // If User 2 save fails, insert directly to bypass unique constraint
      await mongoose.connection.db.collection('users').insertOne({ 
        username: 'user2', 
        password: 'password123',
        email: user1.email, 
        __enc_email: true 
      });
      console.log('User 2 created via direct insert.');
    }
    
    const user2Doc = await User.findOne({ username: 'user2' });
    
    // Simulate req, res, next for User 2 update
    const req = {
      params: { username: 'user2' },
      user: { _id: user2Doc._id, username: 'user2', role: 'user' },
      body: { 
        firstName: 'Test2',
        email: ''
      }
    };
    
    const res = {
      status: (s) => console.log('Status set to:', s),
      json: (data) => { console.log('Success!', data._id); process.exit(0); }
    };
    
    const next = (err) => {
      console.error('API threw error:', err);
      process.exit(1);
    };
    
    await updateUserProfile(req, res, next);
    
  } catch (e) {
    console.error('FATAL ERROR:', e);
    process.exit(1);
  }
});
