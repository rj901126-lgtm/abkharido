const mongoose = require('mongoose');
const User = require('./server/models/User.js').default;

mongoose.connect('mongodb://127.0.0.1:27017/test').then(async () => {
  try {
    const user = await User.findOne();
    if (!user) { console.log('No user'); return process.exit(0); }
    
    console.log('Testing updateOne with null encrypted field');
    
    await User.updateOne(
      { _id: user._id },
      { $set: { city: null } }
    );
    
    console.log('Success!');
    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
});
