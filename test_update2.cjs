const mongoose = require('mongoose');
const User = require('./server/models/User.js').default;
const { updateUserProfile } = require('./server/controllers/userController.js');

mongoose.connect('mongodb://127.0.0.1:27017/test').then(async () => {
  try {
    const user = await User.findOne();
    if (!user) { console.log('No user'); return process.exit(0); }
    
    // Simulate req, res, next
    const req = {
      params: { username: user._id.toString() },
      user: { _id: user._id, username: user.username, role: user.role },
      body: { 
        firstName: 'Test',
        lastName: 'User',
        pincode: '123456',
        address: '123 Test St',
        houseNo: '123',
        streetArea: 'Test St',
        city: 'Test City',
        state: 'Test State',
        addressType: 'Home',
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
    console.error('ERROR:', e.message);
    process.exit(1);
  }
});
