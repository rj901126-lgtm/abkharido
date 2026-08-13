const fetch = require('node-fetch');

async function test() {
  try {
    // Generate a valid JWT token for super_admin
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: '6a60ba3851ee3ad95bf8f057', role: 'super_admin' }, 'abkharido_jwt_secret_dev');
    
    console.log('Sending request...');
    const res = await fetch('http://localhost:5000/api/users/6a60ba3851ee3ad95bf8f057/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        phone: '1234567890'
      })
    });
    
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text);
  } catch (e) {
    console.error('Fetch error:', e);
  }
}
test();
