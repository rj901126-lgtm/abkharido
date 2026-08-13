const mongoose = require('mongoose');
const User = require('./server/models/User.js').default;

mongoose.connect('mongodb://127.0.0.1:27017/test').then(async () => {
  try {
    await User.deleteMany({});
    const user1 = new User({ username: 'user1', email: 'test@test.com', password: '123' });
    await user1.save();
    
    const user2 = new User({ username: 'user2', email: 'test@test.com', password: '123' });
    try {
      await user2.save();
    } catch (err) {
      console.log('Error name:', err.name);
      console.log('Error code:', err.code);
      console.log('Error keys:', Object.keys(err));
      console.log('err.keyValue:', err.keyValue);
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});
