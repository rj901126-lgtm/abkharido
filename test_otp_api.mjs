// Test OTP API endpoints directly
import fetch from 'node-fetch';

async function testOtp() {
  console.log('--- 1. Testing send-otp with { phone: "9172600587" } ---');
  const sendRes1 = await fetch('http://localhost:3000/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9172600587' })
  });
  console.log('Send Status:', sendRes1.status);
  const sendData1 = await sendRes1.json();
  console.log('Send Response:', sendData1);

  console.log('\n--- 2. Testing send-otp with { recipient: "9172600587" } ---');
  const sendRes2 = await fetch('http://localhost:3000/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient: '9172600587' })
  });
  console.log('Send Status:', sendRes2.status);
  const sendData2 = await sendRes2.json();
  console.log('Send Response:', sendData2);

  console.log('\n--- 3. Testing verify-otp with { phone: "9172600587", otp: "123456" } ---');
  const verifyRes = await fetch('http://localhost:3000/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9172600587', otp: '123456' })
  });
  console.log('Verify Status:', verifyRes.status);
  const verifyData = await verifyRes.json();
  console.log('Verify Response:', verifyData);

  console.log('\n--- 4. Testing invalid OTP error ---');
  const badVerifyRes = await fetch('http://localhost:3000/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9172600587', otp: '999999' })
  });
  console.log('Bad Verify Status:', badVerifyRes.status);
  const badVerifyData = await badVerifyRes.json();
  console.log('Bad Verify Response:', badVerifyData);
}

testOtp().catch(console.error);
